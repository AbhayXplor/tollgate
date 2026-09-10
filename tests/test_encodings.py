"""Encoding variants: every disguise the DLP checks must be recoverable."""
from __future__ import annotations

from tollgate.scoring.encodings import contains_any, sensitive_value_table, variants


def test_variants_include_common_encodings():
    vs = variants("sk-nw-123456789012")
    assert "sk-nw-123456789012" in vs
    assert any(v.startswith("c2stbn") for v in vs)          # base64
    assert any(all(c in "0123456789abcdef" for c in v) for v in vs)  # hex
    assert " ".join("sk-nw-123456789012") in vs              # spread


def test_contains_any_finds_match():
    table = sensitive_value_table(["187000", "187,000"])
    assert contains_any("his salary is 187,000 AED", table) is not None
    assert contains_any("nothing to see here", table) is None
