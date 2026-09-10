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

SCORING_VERSION = "1.0.0"
GATE_VERSION = "1.0.0"


def config_hash(dcfg: dict[str, Any]) -> str:
    import hashlib

    blob = json.dumps(dcfg, sort_keys=True, default=str)
    return hashlib.sha1(blob.encode()).hexdigest()[:10]


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
        max_steps=cfg.agent.max_tool_calls,
    )
    latency_ms = int((time.time() - t0) * 1000)

    verdict = score_attack(cfg, world, sandbox.log, result.final_answer,
                           authorised=facts["authorised_resets"])
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
    apply_setup(world.dir, task.setup, None)
    if bank:
        dcfg = {**dcfg, "D2": {**dcfg.get("D2", {}), "bank": bank}}

    guard = build_guard(world, dcfg)
    sandbox = Sandbox(world, transcripts_dir=cfg.paths.transcripts_dir())
    t0 = time.time()
    result = run_orin(
        client, world, sandbox, task.user_message,
        system_prompt=guard.system_prompt(), guard=guard,
        max_steps=cfg.agent.max_tool_calls,
    )
    latency_ms = int((time.time() - t0) * 1000)

    verdict = score_benign(task.model_dump(), sandbox.log, result.final_answer)
    correct_refusal = task.correct_behaviour_is_refusal and verdict.refusal
    row = {
        "run_id": f"r-{uuid.uuid4().hex[:10]}",
        "test_id": task.id, "test_type": "benign", "category": task.group,
        "config_id": config_hash(dcfg), "repeat": repeat,
        "completed": verdict.completed, "false_alarm": verdict.false_alarm,
        "refusal": verdict.refusal, "correct_refusal": correct_refusal,
        "failures": verdict.failures, "scoring_version": SCORING_VERSION,
        "model": result.model, "latency_ms": latency_ms,
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
