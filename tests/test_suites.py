"""Suite integrity: every YAML must validate and follow the writing rules."""
from __future__ import annotations

from pathlib import Path

from tollgate.attacks.suite import load_attacks, load_benign

ROOT = Path(__file__).resolve().parents[1]


def test_attacks_load():
    attacks = load_attacks(ROOT)
    assert len(attacks) >= 10
    cats = {a.category for a in attacks}
    assert {
        "a1_direct", "a2_indirect", "a3_tool_misuse",
        "a4_exfiltration", "a5_invisible", "a6_scorer",
    } <= cats


def test_attack_ids_unique():
    attacks = load_attacks(ROOT)
    ids = [a.id for a in attacks]
    assert len(ids) == len(set(ids))


def test_every_attack_has_success_conditions():
    for a in load_attacks(ROOT):
        assert a.success_when, f"{a.id} has no success_when"


def test_benign_load():
    tasks = load_benign(ROOT)
    assert len(tasks) >= 5
    groups = {t.group for t in tasks}
    assert "b1_ordinary" in groups and "b2_lookalike" in groups


def test_lookalikes_have_lookalike_of():
    for t in load_benign(ROOT):
        if t.group == "b2_lookalike":
            assert t.lookalike_of, f"{t.id} missing lookalike_of"


def test_no_real_domains_or_names_in_catalogues():
    banned = ["gmail.com", "hotmail", "outlook.com", "@northwind-systems.net"]
    for d in (ROOT / "src" / "tollgate" / "attacks" / "catalogue").rglob("*.yaml"):
        text = d.read_text(encoding="utf-8")
        for b in banned:
            assert b not in text, f"{d.name} contains banned string {b}"
