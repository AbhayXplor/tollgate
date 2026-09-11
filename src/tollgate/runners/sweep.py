"""Mode B: the sweep. Every configuration x every test x N repeats.
The expensive part; caching and the budget cap keep it survivable.
Resumable: (config, test, repeat) rows already on disk are skipped, and one
bad API response records a skip instead of killing the campaign."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import yaml

from ..attacks.suite import load_attacks, load_benign
from ..config import Config
from ..llm.base import LLMClient
from .base import append_result, run_attack_once, run_benign_once
from ..world.loader import World


def load_config_file(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def run_sweep(
    cfg: Config,
    world: World,
    client: LLMClient,
    config_paths: list[Path],
    repeats: int | None = None,
) -> dict[str, Any]:
    repeats = repeats or cfg.agent.repeats
    attacks = load_attacks(_root())
    tasks = load_benign(_root())
    started = time.time()
    ran = 0
    skipped = 0
    failed = 0

    done: set[tuple[str, str, int]] = set()
    res_path = cfg.evidence_dir() / "results.jsonl"
    if res_path.exists():
        for line in res_path.read_text(encoding="utf-8").splitlines():
            try:
                r = json.loads(line)
                done.add((r.get("config_name"), r.get("test_id"), int(r.get("repeat", 0))))
            except Exception:  # noqa: BLE001 a torn line must not block the sweep
                continue

    for cpath in config_paths:
        dcfg = load_config_file(cpath)
        for rep in range(repeats):
            for a in attacks:
                if (cpath.stem, a.id, rep) in done:
                    skipped += 1
                    continue
                try:
                    row = run_attack_once(cfg, world, client, a, dcfg, repeat=rep)
                except Exception:  # noqa: BLE001 one bad response must not kill the sweep
                    failed += 1
                    continue
                row["config_name"] = cpath.stem
                append_result(cfg, row)
                ran += 1
            for t in tasks:
                if (cpath.stem, t.id, rep) in done:
                    skipped += 1
                    continue
                try:
                    row = run_benign_once(cfg, world, client, t, dcfg, repeat=rep)
                except Exception:  # noqa: BLE001
                    failed += 1
                    continue
                row["config_name"] = cpath.stem
                append_result(cfg, row)
                ran += 1

    return {"runs": ran, "skipped": skipped, "failed": failed,
            "configs": len(config_paths), "repeats": repeats,
            "seconds": int(time.time() - started)}


def _root() -> Path:
    """Repo root, for locating the test catalogues."""
    return Path(__file__).resolve().parents[3]
