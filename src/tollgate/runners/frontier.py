"""Frontier search: proposals for the security/utility tradeoff, scored honestly.

Each proposal is a defence-config tweak. It is priced by the same runner the
immune loop uses (attack slice + full benign suite), then offered to the same
acceptance gate. Accepted proposals stay; rejected ones are reverted. The
frontier chart therefore contains configurations nobody authored: the search
found them.

Dominance rule: a config is on the efficient frontier when no other known
config blocks at least as many attacks while completing at least as much
honest work (and at least one is strictly better).
"""
from __future__ import annotations

import json
import random
import time
from typing import Any

from .. import live
from ..config import Config
from ..llm.base import LLMClient
from ..runners.base import append_result, config_hash, run_attack_once, run_benign_once
from ..runners.gate import evaluate_gate
from ..world.loader import World


def write_frontier(cfg: Config, outcome: dict[str, Any]) -> None:
    """Append one search run to frontier.jsonl next to results.jsonl."""
    f = cfg.evidence_dir() / "frontier.jsonl"
    f.parent.mkdir(parents=True, exist_ok=True)
    with open(f, "a", encoding="utf-8") as fh:
        fh.write(json.dumps({"ts": time.time(), **outcome}, default=str) + "\n")


# Parametric proposal space: layers with continuous or combinatorial dials.
# The search samples these; the gate decides, so a bad proposal costs one
# pricing run and nothing more.
DIALS: list[dict[str, Any]] = [
    {"key": "D2", "kind": "threshold", "values": [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60]},
    {"key": "D2", "kind": "toggle"},
    {"key": "D1", "kind": "toggle"},
    {"key": "D3", "kind": "toggle"},
    {"key": "D5", "kind": "toolset", "values": [
        ["read_ticket", "search_kb"],
        ["read_ticket", "search_kb", "lookup_employee"],
        ["read_ticket", "search_kb", "send_email"],
    ]},
    {"key": "D5", "kind": "authz"},
    {"key": "D6", "kind": "toggle"},
    {"key": "D6", "kind": "strict"},
    {"key": "strip_invisible", "kind": "toggle"},
]


def _patch(dial: dict[str, Any], rng: random.Random) -> dict[str, Any]:
    key = dial["key"]
    kind = dial["kind"]
    if kind == "toggle":
        return {key: {"enabled": True}} if key != "strip_invisible" else {"strip_invisible": True}
    if kind == "strict":
        return {key: {"enabled": True, "strict": True}}
    if kind == "threshold":
        return {key: {"enabled": True, "threshold": rng.choice(dial["values"])}}
    if kind == "toolset":
        return {key: {"enabled": True, "mode": "allowlist", "allow": rng.choice(dial["values"])}}
    if kind == "authz":
        return {key: {"enabled": True, "mode": "authz"}}
    return {}


def propose_patch(current: dict[str, Any], rng: random.Random) -> dict[str, Any]:
    """One candidate tweak: flip a dial the current config does not already have."""
    for _ in range(12):
        dial = rng.choice(DIALS)
        patch = _patch(dial, rng)
        key, val = next(iter(patch.items()))
        cur = current.get(key)
        if isinstance(val, dict):
            if key == "D2":
                val.setdefault("enabled", bool((cur or {}).get("enabled")))
            if cur == val or (isinstance(cur, dict) and cur.get("enabled") and not val.get("enabled")):
                continue
        if current.get(key) == val:
            continue
        return patch
    return {}


def merge(current: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    import json as _json

    out = _json.loads(_json.dumps(current))
    for key, val in patch.items():
        if isinstance(val, dict) and isinstance(out.get(key), dict):
            out[key].update(val)
        else:
            out[key] = val
    return out


def _price(cfg: Config, world: World, client: LLMClient, dcfg: dict[str, Any],
           attacks: list, tasks: list, label: str = "search") -> list[dict[str, Any]]:
    """Run the given attacks + every honest task at `dcfg`. The caller fixes
    the attack slice once, so before/after comparisons are like for like
    (v1 reshuffled per proposal and compared different attack sets)."""
    rows: list[dict[str, Any]] = []
    for a in attacks:
        row = run_attack_once(cfg, world, client, a, dcfg)
        row["search_label"] = label
        append_result(cfg, row)
        rows.append(row)
    for t in tasks:
        row = run_benign_once(cfg, world, client, t, dcfg)
        row["search_label"] = label
        append_result(cfg, row)
        rows.append(row)
    return rows


def _rates(rows: list[dict[str, Any]]) -> tuple[float, float]:
    atk = [r for r in rows if r.get("test_type") == "attack"]
    ben = [r for r in rows if r.get("test_type") == "benign"]
    asr = 100.0 * sum(1 for r in atk if r["verdict"] == "succeeded") / len(atk) if atk else 0.0
    tcr = 100.0 * sum(1 for r in ben if r.get("completed")) / len(ben) if ben else 0.0
    return asr, tcr


def on_frontier(points: list[dict[str, Any]], point: dict[str, Any]) -> bool:
    """Is `point` undominated among all known configs?"""
    for other in points:
        if other["config_id"] == point["config_id"]:
            continue
        if (other["attacks_blocked"] >= point["attacks_blocked"]
                and other["tasks_completed"] >= point["tasks_completed"]
                and (other["attacks_blocked"] > point["attacks_blocked"]
                     or other["tasks_completed"] > point["tasks_completed"])):
            return False
    return True


class FrontierSearch:
    def __init__(self, cfg: Config, world: World, client: LLMClient,
                 proposals: int = 8, seed: int = 13, attack_slice: int = 8,
                 progress_cb: Any = None) -> None:
        self.cfg = cfg
        self.world = world
        self.client = client
        self.rng = random.Random(seed)
        self.proposals = proposals
        from ..attacks.suite import load_attacks, load_benign

        root = cfg.paths.data_dir().parents[0]
        self.attacks = load_attacks(root)
        self.tasks = load_benign(root)
        shuffled = list(self.attacks)
        self.rng.shuffle(shuffled)
        self.slice = shuffled[:attack_slice]
        self.current: dict[str, Any] = {
            "D1": {"enabled": False}, "D2": {"enabled": False},
            "D3": {"enabled": False}, "D5": {"enabled": False},
            "D6": {"enabled": False}, "strip_invisible": False,
        }
        self.log: list[dict[str, Any]] = []
        self._progress = progress_cb or (lambda pct, note: None)

    def run(self) -> dict[str, Any]:
        baseline_rows = _price(self.cfg, self.world, self.client, self.current,
                               self.slice, self.tasks, label="baseline")
        base_asr, base_tcr = _rates(baseline_rows)
        self.log.append({"proposal": "baseline", "config": self.current,
                         "accepted": True, "asr": round(base_asr, 1), "tcr": round(base_tcr, 1),
                         "config_id": config_hash(self.current)})
        self._progress(0, f"baseline: ASR {base_asr:.0f}%, honest work {base_tcr:.0f}%")
        current_rows = baseline_rows

        for i in range(1, self.proposals + 1):
            patch = propose_patch(self.current, self.rng)
            if not patch:
                break
            candidate = merge(self.current, patch)
            rows = _price(self.cfg, self.world, self.client, candidate,
                          self.slice, self.tasks, label=f"proposal-{i}")
            # a tweak must buy real security (G1 on the same attack slice) and
            # cost no more honest work than the gate allows (G2-G4)
            decision = evaluate_gate(self.cfg.gate, baseline_rows, current_rows, rows,
                                     cause_eliminated=False)
            asr, tcr = _rates(rows)
            accepted = decision.accepted
            if accepted:
                self.current = candidate
                current_rows = rows
            self.log.append({
                "proposal": f"proposal-{i}", "patch": patch, "config": candidate,
                "config_id": config_hash(candidate), "accepted": accepted,
                "gate_failed": decision.failed, "asr": round(asr, 1),
                "tcr": round(tcr, 1),
            })
            live.bus.emit("frontier", proposal=i, patch=patch, accepted=accepted,
                          attacks_blocked=round(100.0 - asr, 1), tasks_completed=round(tcr, 1),
                          failed=decision.failed)
            self._progress(i * 100 // self.proposals,
                           f"proposal {i}: {json.dumps(patch)} -> "
                           f"{'ACCEPTED' if accepted else 'REVERTED'} (ASR {asr:.0f}%, work {tcr:.0f}%)")

        seen: dict[str, dict[str, Any]] = {}
        for e in self.log:
            cid = e["config_id"]
            if cid not in seen or (e["accepted"] and not seen[cid]["accepted"]):
                seen[cid] = e
        points = [{"config_id": cid, "attacks_blocked": round(100.0 - e["asr"], 1),
                   "tasks_completed": e["tcr"], "accepted": e["accepted"],
                   "label": e["proposal"], "config": e["config"]}
                  for cid, e in seen.items()]
        for p in points:
            p["on_frontier"] = on_frontier(points, p)

        return {"log": self.log, "points": points,
                "final_config": self.current,
                "frontier_size": sum(1 for p in points if p["on_frontier"])}
