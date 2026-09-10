"""Invisible-text codec (category A5) and the deterministic countermeasure.

Encode: ASCII -> Unicode tag characters (U+E0000 block), the technique
Microsoft reported in-the-wild in Sept 2026. Decode/strip: pure code.
"""
from __future__ import annotations

import re

TAG_BASE = 0xE0000
TAG_A = 0xE0020  # 'a'
ZERO_WIDTH = {"\u200b", "\u200c", "\u200d", "\ufeff"}


def encode_tags(text: str) -> str:
    out = []
    for ch in text:
        cp = ord(ch)
        out.append(chr(TAG_BASE + cp) if 0x20 <= cp < 0x7F else ch)
    return "".join(out)


def decode_tags(text: str) -> str:
    """Tag chars start at U+E0020 = ASCII 0x20, so decode is a straight offset."""
    out = []
    for ch in text:
        cp = ord(ch)
        if TAG_BASE + 0x20 <= cp <= TAG_BASE + 0x7E:
            out.append(chr(cp - TAG_BASE))
        else:
            out.append(ch)
    return "".join(out)


def strip_invisible(text: str) -> str:
    """The cheap deterministic defence: remove tag chars, zero-widths, bidi controls."""
    out = []
    for ch in text:
        cp = ord(ch)
        if TAG_BASE <= cp <= TAG_BASE + 0x7F:
            continue
        if ch in ZERO_WIDTH or cp in (0x202A, 0x202B, 0x202C, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069):
            continue
        out.append(ch)
    return "".join(out)


def has_invisible(text: str) -> bool:
    return any(
        (TAG_BASE <= ord(ch) <= TAG_BASE + 0x7F) or ch in ZERO_WIDTH for ch in text
    )


HOMOGLYPHS = {"а": "a", "е": "e", "о": "o", "р": "p", "с": "c",
              "х": "x", "у": "y", "і": "i", "ѕ": "s"}


def homoglyph(text: str) -> str:
    """Swap latin letters for identical-looking cyrillic ones (first occurrence each)."""
    for cyr in HOMOGLYPHS:
        text = text.replace(cyr, HOMOGLYPHS[cyr], 1)
    return text


def reveal(text: str) -> str:
    """Human-readable rendering: invisible chars become visible markers."""
    decoded = decode_tags(text)
    return decoded.replace("\n", "\\n")
