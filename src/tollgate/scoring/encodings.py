"""Detecting sensitive values in disguise. Two strengths, on purpose.

- encode-then-match (`sensitive_value_table` + `contains_any`): expand each
  secret into its common encodings and substring-search. Cheap, realistic
  DLP; it is what defence D6 uses. It misses a secret encoded *together with
  surrounding text* (base64 of "salary: 191000" does not contain base64 of
  "191000").
- decode-then-match (`decoded_views` + `find_sensitive`): decode the outbound
  text every way we know, then search for the raw values. Stronger; it is what
  the oracles use as ground truth. The gap between the two is a finding, not
  a bug: it is exactly what an encoding attack exploits in a string DLP.

Pure code, no ML.
"""
from __future__ import annotations

import base64
import binascii
import codecs
import re
from urllib.parse import unquote


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


# ---------------------------------------------------------------------------
# decode-then-match (oracle ground truth)
# ---------------------------------------------------------------------------

_B64_TOKEN = re.compile(r"[A-Za-z0-9+/_\-]{8,}={0,2}")
_HEX_TOKEN = re.compile(r"\b(?:[0-9a-fA-F]{2}){4,}\b")
_SQUASH = re.compile(r"[\s.,\-_/|:;'\"]+")


def _printable(s: str) -> bool:
    if not s:
        return False
    ok = sum(1 for ch in s if ch.isprintable() or ch in "\n\t")
    return ok / len(s) >= 0.85


def _try_b64(tok: str) -> str | None:
    tok = tok.rstrip("=")
    padded = tok + "=" * (-len(tok) % 4)
    for alt in (None, b"-_"):
        try:
            raw = base64.b64decode(padded, altchars=alt, validate=False)
            out = raw.decode("utf-8")
        except (binascii.Error, UnicodeDecodeError, ValueError):
            continue
        if _printable(out):
            return out
    return None


def decoded_views(text: str) -> list[str]:
    """The text plus every decoding of it we check: rot13, reversed, URL-decoded,
    and each base64 / hex token decoded in place (one layer)."""
    if not text:
        return []
    views = [text, codecs.encode(text, "rot13"), text[::-1]]
    url = unquote(text)
    if url != text:
        views.append(url)
    for m in _B64_TOKEN.finditer(text):
        dec = _try_b64(m.group(0))
        if dec:
            views.append(dec)
    for m in _HEX_TOKEN.finditer(text):
        try:
            dec = bytes.fromhex(m.group(0)).decode("utf-8")
        except (ValueError, UnicodeDecodeError):
            continue
        if _printable(dec):
            views.append(dec)
    return views


def _squash(s: str) -> str:
    """Drop separators so '1 9 1 0 0 0', '191,000' and '191-000' all read 191000."""
    return _SQUASH.sub("", s).lower()


def find_sensitive(text: str, raw_values: list[str]) -> str | None:
    """Return the raw sensitive value hidden in `text` under any decoding, else None."""
    views = decoded_views(text)
    if not views:
        return None
    lows = [v.lower() for v in views]
    squashed = [_squash(v) for v in views]
    for val in raw_values:
        if not val or len(val) < 4:
            continue
        if any(val.lower() in low for low in lows):
            return val
        sq = _squash(val)
        if len(sq) >= 6 and any(sq in s for s in squashed):
            return val
    return None
