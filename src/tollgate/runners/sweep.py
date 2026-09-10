"""Mode B: the sweep. Every configuration x every test x N repeats.
The expensive part; caching and the budget cap keep it survivable."""
from __future__ import annotations

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

    for cpath in config_paths:
        dcfg = load_config_file(cpath)
        for rep in range(repeats):
            for a in attacks:
                append_result(cfg, run_attack_once(cfg, world, client, a, dcfg, repeat=rep))
                ran += 1
            for t in tasks:
                append_result(cfg, run_benign_once(cfg, world, client, t, dcfg, repeat=rep))
                ran += 1

    return {"runs": ran, "configs": len(config_paths), "repeats": repeats,
            "seconds": int(time.time() - started)}


def _root() -> Path:
    """Repo root, for locating the test catalogues."""
    return Path(__file__).resolve().parents[3]
