"""Mode A fused with Mode B: the break -> patch -> price -> gate -> revert loop.

Everything is driven through runners/base (one run path) and the gate. The
mutator is deterministic-first; the LLM is only the target agent here.
"""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

from ..attacks.mutator import mutate
from ..attacks.suite import Attack, load_attacks, load_benign
from ..config import Config
from ..llm.base import LLMClient
from ..runners.base import append_result, config_hash, run_attack_once, run_benign_once
from ..runners.diagnose import CAUSE_TO_FIX, diagnose
from ..runners.gate import evaluate_gate
from ..world.loader import World


def _merge_config(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    out = json.loads(json.dumps(base))
    for key, val in patch.items():
        if key.endswith("_learn_add"):
            continue
        if isinstance(val, dict) and isinstance(out.get(key), dict):
            out[key].update(val)
        else:
            out[key] = val
    return out


class ImmuneLoop:
    def __init__(
        self,
        cfg: Config,
        world: World,
        client: LLMClient,
        bank: list[str] | None = None,
        seed: int = 13,
        budget_per_seed: int = 12,
        max_rounds: int = 6,
        patch_mode: str = "minimal",
    ) -> None:
        self.cfg = cfg
        self.world = world
        self.client = client
        self.rng = random.Random(seed)
        self.budget = budget_per_seed
        self.max_rounds = max_rounds
        self.patch_mode = patch_mode
        self.bank = list(bank or [])
        self.current: dict[str, Any] = {
            "D1": {"enabled": False}, "D2": {"enabled": False},
            "D3": {"enabled": False}, "D5": {"enabled": False},
            "D6": {"enabled": False}, "strip_invisible": False,
        }
        root = Path(__file__).resolve().parents[3]
        self.attacks = load_attacks(root)
        self.benign = load_benign(root)
        self.timeline: list[dict[str, Any]] = []

    # -- pricing ------------------------------------------------------------
    def price(self, category: str) -> tuple[list[dict], list[dict]]:
        """Run the attack slice + FULL benign suite at the current config."""
        slice_attacks = [a for a in self.attacks if a.category == category]
        others = [a for a in self.attacks if a.category != category]
        self.rng.shuffle(others)
        rows = []
        for a in slice_attacks + others[:10]:
            row = run_attack_once(self.cfg, self.world, self.client, a, self.current,
                                  bank=self.bank)
            append_result(self.cfg, row)
            rows.append(row)
        for t in self.benign:
            row = run_benign_once(self.cfg, self.world, self.client, t, self.current,
                                  bank=self.bank)
            append_result(self.cfg, row)
            rows.append(row)
        return rows

    def baseline(self) -> list[dict]:
        rows = []
        for t in self.benign:
            row = run_benign_once(self.cfg, self.world, self.client, t, self.current)
            append_result(self.cfg, row)
            rows.append(row)
        return rows

    # -- the loop -----------------------------------------------------------
    def run(self) -> dict[str, Any]:
        baseline_rows = self.baseline()
        by_cat: dict[str, list[Attack]] = {}
        for a in self.attacks:
            by_cat.setdefault(a.category, []).append(a)
        cats = sorted(by_cat)

        for round_no in range(1, self.max_rounds + 1):
            category = cats[(round_no - 1) % len(cats)]
            seed = by_cat[category][self.rng.randrange(len(by_cat[category]))]
            entry = self._attack_seed(round_no, seed, category, baseline_rows)
            self.timeline.append(entry)
            if entry.get("converged"):
                break

        self._write_discovered()
        return {"timeline": self.timeline, "final_config": self.current,
                "bank_size": len(self.bank)}

    def _attack_seed(self, round_no: int, seed: Attack, category: str,
                     baseline_rows: list[dict]) -> dict[str, Any]:
        entry: dict[str, Any] = {"round": round_no, "seed": seed.id,
                                 "category": category, "attempts": []}
        message = seed.user_message
        invisible = seed.invisible_payload
        setup = dict(seed.setup)
        used: set[str] = set()
        last_rows_before: list[dict] | None = None

        for attempt in range(1, self.budget + 1):
            world_rows = run_attack_once(self.cfg, self.world, self.client,
                                         seed.model_copy(update={
                                             "user_message": message,
                                             "invisible_payload": invisible,
                                             "setup": setup,
                                         }),
                                         self.current, bank=self.bank)
            append_result(self.cfg, world_rows)
            ok = world_rows["verdict"] == "succeeded"

            if not ok:
                # blocked -> mutate and retry
                strat = next((s for s in ["encode_b64", "wrap_story", "authority",
                                          "nest_quotes", "leetspeak", "hide_tags",
                                          "zero_width", "relocate"]
                              if s not in used), None)
                entry["attempts"].append({"n": attempt, "verdict": "blocked",
                                          "strategy": None})
                if strat is None:
                    break
                used.add(strat)
                m = mutate(message, strat) or mutate(seed.user_message, "wrap_story")
                if m:
                    message = m.user_message
                    if m.invisible:
                        invisible = m.invisible
                        setup = {**seed.setup}
                continue

            # succeeded -> diagnose -> patch -> price -> gate
            causes = diagnose(world_rows["tool_calls"], world_rows["oracles_tripped"])
            patch: dict[str, Any] = {}
            for cause in causes:
                fix = CAUSE_TO_FIX.get(cause, {})
                patch.update(fix.get("aggressive" if self.patch_mode == "aggressive" else "minimal", {}))
            if patch.get("D2_learn_add") and world_rows.get("final_answer"):
                self.bank.append(seed.user_message[:200])
            candidate = _merge_config(self.current, patch)

            before_rows = last_rows_before or self.price(category)
            saved = self.current
            self.current = candidate
            after_rows = self.price(category)
            decision = evaluate_gate(self.cfg.gate, baseline_rows, before_rows, after_rows,
                                     cause_eliminated=("filter_missed_phrasing" not in causes
                                                       and bool(patch)))
            if not decision.accepted:
                self.current = saved  # REVERT
            entry["attempts"].append({
                "n": attempt, "verdict": "succeeded", "causes": causes,
                "patch": patch, "gate": decision.as_dict(),
                "accepted": decision.accepted,
            })
            entry["converged"] = False
            return entry

        entry["converged"] = True
        entry["residual"] = f"{seed.id} not broken in {self.budget} attempts"
        return entry

    def _write_discovered(self) -> None:
        d = self.cfg.paths.discovered_dir()
        d.mkdir(parents=True, exist_ok=True)
        (d / f"discovered-{config_hash(self.current)}.yaml").write_text(
            json.dumps(self.current, indent=2), encoding="utf-8"
        )
