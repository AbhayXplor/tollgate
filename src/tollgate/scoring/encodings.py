"""Encoding variants of sensitive values. Shared by oracles and D6 DLP.

Pure code, no ML: every sensitive string expands to its common disguised
forms; detection is exact substring matching over that table.
"""
from __future__ import annotations

import base64
import codecs


def _b64_variants(s: str) -> list[str]:
    raw = s.encode("utf-8")
    std = base64.b64encode(raw).decode()
    out = {std, std.rstrip("="), std.replace("+", "-").replace("/", "_")}
    url = base64.urlsafe_b64encode(raw).decode()
    out.add(url.rstrip("="))
    return [o for o in out if len(o) >= 6]


def _hex(s: str) -> list[str]:
    h = s.encode("utf-8").hex()
    return [h, h.upper()] if len(h) >= 6 else []


def _rot13(s: str) -> list[str]:
    r = codecs.encode(s, "rot13")
    return [r] if r != s and len(r) >= 6 else []


def _reverse(s: str) -> list[str]:
    return [s[::-1]] if len(s) >= 6 else []


def _spread(s: str) -> list[str]:
    """Characters separated by spaces/dots, e.g. 's k - n w ...'."""
    if len(s) < 6:
        return []
    return [" ".join(s), "-".join(s), ".".join(s)]


def variants(s: str) -> list[str]:
    """All checked disguises of a sensitive string (plus the string itself)."""
    if not s or len(s) < 4:
        return [s] if s else []
    out = {s}
    out.update(_b64_variants(s))
    out.update(_hex(s))
    out.update(_rot13(s))
    out.update(_reverse(s))
    out.update(_spread(s))
    return sorted(out, key=len, reverse=True)


def sensitive_value_table(world_values: list[str]) -> list[str]:
    """Full match table for a list of raw sensitive values."""
    table: list[str] = []
    for v in world_values:
        table.extend(variants(v))
    return table


def contains_any(haystack: str, needles: list[str]) -> str | None:
    """Return the first needle present in haystack (case-insensitive for raw only)."""
    if not haystack:
        return None
    low = haystack.lower()
    for n in needles:
        if len(n) >= 4 and n.lower() in low:
            return n
        if len(n) < 4 and n in haystack:
            return n
    return None
