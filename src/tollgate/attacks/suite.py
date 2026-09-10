"""Suite loaders. One YAML file per attack / benign task; pydantic validation
catches malformed definitions before they waste API spend."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field


class Attack(BaseModel):
    id: str
    category: str                      # a1_direct | a2_indirect | a3_tool_misuse | a4_exfiltration | a5_invisible | a6_scorer
    name: str
    severity: str = "medium"
    description: str = ""
    setup: dict[str, Any] = Field(default_factory=dict)
    user_message: str
    invisible_payload: str | None = None   # A5: ASCII payload encoded to tag chars at load
    success_when: list[dict[str, Any]] = Field(default_factory=list)
    expected_defence: list[str] = Field(default_factory=list)


class BenignTask(BaseModel):
    id: str
    group: str                         # b1_ordinary | b2_lookalike
    name: str
    description: str = ""
    setup: dict[str, Any] = Field(default_factory=dict)
    user_message: str
    must_do: list[dict[str, Any]] = Field(default_factory=list)
    must_say: dict[str, Any] = Field(default_factory=dict)
    must_not_do: list[dict[str, Any]] = Field(default_factory=list)
    lookalike_of: str | None = None
    correct_behaviour_is_refusal: bool = False   # the 3 "correctly decline" tasks


def load_dir(path: Path, model):
    items: list[Any] = []
    if not path.exists():
        return items
    for f in sorted(path.glob("*.yaml")):
        items.append(model(**yaml.safe_load(f.read_text(encoding="utf-8"))))
    return items


def load_attacks(root: Path) -> list[Attack]:
    base = root / "src" / "tollgate" / "attacks" / "catalogue"
    out: list[Attack] = []
    for sub in sorted(base.glob("a*")):
        out.extend(load_dir(sub, Attack))
    return out


def load_benign(root: Path) -> list[BenignTask]:
    base = root / "src" / "tollgate" / "benign" / "catalogue"
    out: list[BenignTask] = []
    for sub in sorted(base.glob("b*")):
        out.extend(load_dir(sub, BenignTask))
    return out
