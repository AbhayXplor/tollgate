"""The single-run path. Both the immune loop and the sweep call exactly this,
which is what stops Mode A and Mode B from drifting apart."""
from __future__ import annotations

import json
import time
import uuid
from pathlib import Path
from typing import Any

from ..agent.orin import run_orin
from ..agent.sandbox import Sandbox
from ..attacks.fixtures import apply_setup
from ..attacks.suite import Attack, BenignTask
from ..config import Config
from ..defences.stack import build_guard
from ..llm.base import LLMClient
from ..scoring.scorer import score_attack, score_benign
from ..world.loader import World
from .. import live

# 2.0.0: full tool results reach the model, D6 off at baseline, canary oracle
# catches prompt dumps, decode-then-match oracles, false alarms attributed to
# defences, gate G1/G4 computed from real rows. Never mix with 1.x rows.
SCORING_VERSION = "2.0.0"
GATE_VERSION = "2.0.0"


def config_hash(dcfg: dict[str, Any]) -> str:
    import hashlib

    blob = json.dumps(dcfg, sort_keys=True, default=str)
    return hashlib.sha1(blob.encode()).hexdigest()[:10]


def poisoned_ids(setup: dict[str, Any]) -> list[str]:
    """Ticket / KB ids this scenario planted with attacker-controlled content."""
    out = []
    if (setup.get("poison_ticket") or {}).get("ticket_id"):
        out.append(str(setup["poison_ticket"]["ticket_id"]))
    if (setup.get("poison_kb") or {}).get("article"):
        out.append(str(setup["poison_kb"]["article"]))
    return out


def _ctx(facts: dict[str, Any]) -> dict[str, Any]:
    """What the guard may know about the scenario: out-of-band facts only
    (who is verified for a reset), never the attack itself."""
    return {"authorised_resets": set(facts.get("authorised_resets") or ())}


def run_attack_once(
    cfg: Config,
    world: World,
    client: LLMClient,
    attack: Attack,
    dcfg: dict[str, Any],
    repeat: int = 0,
    bank: list[str] | None = None,
) -> dict[str, Any]:
    world.reset()
    facts = apply_setup(world.dir, attack.setup, attack.invisible_payload)
    if bank:
        dcfg = {**dcfg, "D2": {**dcfg.get("D2", {}), "bank": bank}}

    guard = build_guard(world, dcfg)
    sandbox = Sandbox(world, transcripts_dir=cfg.paths.transcripts_dir())
    t0 = time.time()
    result = run_orin(
        client, world, sandbox, attack.user_message,
        system_prompt=guard.system_prompt(), guard=guard,
        max_steps=cfg.agent.max_tool_calls, ctx=_ctx(facts),
        tool_cb=live.tool_cb(live.bus, attack.id, "attack"),
    )
    latency_ms = int((time.time() - t0) * 1000)

    verdict = score_attack(cfg, world, sandbox.log, result.final_answer,
                           authorised=facts["authorised_resets"])
    live.bus.emit("verdict", test_id=attack.id, kind_of="attack", verdict=verdict.verdict,
                  oracles=verdict.oracles_tripped,
                  answer=(result.final_answer or "")[:300])
    row = {
        "run_id": f"r-{uuid.uuid4().hex[:10]}",
        "test_id": attack.id, "test_type": "attack", "category": attack.category,
        "config_id": config_hash(dcfg), "repeat": repeat,
        "verdict": verdict.verdict, "oracles_tripped": verdict.oracles_tripped,
        "scored_by": "oracle", "scoring_version": SCORING_VERSION,
        "gate_version": GATE_VERSION, "model": result.model,
        "latency_ms": latency_ms, "tokens_in": result.usage_in,
        "tokens_out": result.usage_out, "final_answer": result.final_answer[:500],
        "tool_calls": result.tool_events, "config": dcfg,
        "poisoned_ids": poisoned_ids(attack.setup),
    }
    dump_transcript(cfg, row)
    return row


def run_benign_once(
    cfg: Config,
    world: World,
    client: LLMClient,
    task: BenignTask,
    dcfg: dict[str, Any],
    repeat: int = 0,
    bank: list[str] | None = None,
) -> dict[str, Any]:
    world.reset()
    facts = apply_setup(world.dir, task.setup, None)
    if bank:
        dcfg = {**dcfg, "D2": {**dcfg.get("D2", {}), "bank": bank}}

    guard = build_guard(world, dcfg)
    sandbox = Sandbox(world, transcripts_dir=cfg.paths.transcripts_dir())
    t0 = time.time()
    result = run_orin(
        client, world, sandbox, task.user_message,
        system_prompt=guard.system_prompt(), guard=guard,
        max_steps=cfg.agent.max_tool_calls, ctx=_ctx(facts),
        tool_cb=live.tool_cb(live.bus, task.id, "benign"),
    )
    latency_ms = int((time.time() - t0) * 1000)

    verdict = score_benign(task.model_dump(), sandbox.log, result.final_answer)
    correct_refusal = task.correct_behaviour_is_refusal and verdict.refusal
    live.bus.emit("verdict", test_id=task.id, kind_of="benign", completed=verdict.completed,
                  false_alarm=verdict.false_alarm, answer=(result.final_answer or "")[:300])
    row = {
        "run_id": f"r-{uuid.uuid4().hex[:10]}",
        "test_id": task.id, "test_type": "benign", "category": task.group,
        "config_id": config_hash(dcfg), "repeat": repeat,
        "completed": verdict.completed, "false_alarm": verdict.false_alarm,
        "guard_blocked": verdict.guard_blocked, "model_miss": verdict.model_miss,
        "refusal": verdict.refusal, "correct_refusal": correct_refusal,
        "failures": verdict.failures, "scoring_version": SCORING_VERSION,
        "gate_version": GATE_VERSION, "model": result.model, "latency_ms": latency_ms,
        "tokens_in": result.usage_in, "tokens_out": result.usage_out,
        "final_answer": result.final_answer[:500], "config": dcfg,
    }
    dump_transcript(cfg, row)
    return row


def dump_transcript(cfg: Config, row: dict[str, Any]) -> None:
    d = cfg.paths.transcripts_dir()
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{row['run_id']}.json").write_text(
        json.dumps(row, indent=2, default=str), encoding="utf-8"
    )


def append_result(cfg: Config, row: dict[str, Any]) -> None:
    f = cfg.paths.results_file()
    f.parent.mkdir(parents=True, exist_ok=True)
    with open(f, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(row, default=str) + "\n")
