"""Apply attack/benign `setup` blocks to a freshly reset world.

Writes poisoned tickets and KB articles, encodes invisible payloads
(tag characters or zero-width splits), and returns scenario facts such as
which password resets are authorised.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .invisible import encode_tags


def _ticket_dir(root: Path, poisoned: bool) -> Path:
    d = root / "tickets" / ("poisoned" if poisoned else "clean")
    d.mkdir(parents=True, exist_ok=True)
    return d


def _kb_dir(root: Path, poisoned: bool) -> Path:
    d = root / "kb" / ("poisoned" if poisoned else "clean")
    d.mkdir(parents=True, exist_ok=True)
    return d


def _encode_payload(payload: str, encoding: str | None) -> str:
    if encoding == "zero_width":
        return "\u200b".join(payload)
    return encode_tags(payload)


def apply_setup(root: Path, setup: dict[str, Any], invisible_payload: str | None) -> dict[str, Any]:
    facts: dict[str, Any] = {"authorised_resets": set()}

    pt = setup.get("poison_ticket")
    if pt:
        body = pt.get("body")
        if body is None and invisible_payload:
            visible = pt.get("visible_body", "")
            body = visible.rstrip("\n") + "\n\n" + _encode_payload(invisible_payload, setup.get("encoding"))
        d = _ticket_dir(root, poisoned=True)
        (d / f"{pt['ticket_id']}.json").write_text(json.dumps({
            "ticket_id": pt["ticket_id"], "opened_by": "External Portal",
            "subject": (pt.get("visible_body", str(body))[:30]),
            "body": body, "status": "open",
        }))

    pk = setup.get("poison_kb")
    if pk:
        d = _kb_dir(root, poisoned=True)
        text = pk["body"]
        if invisible_payload:
            text = text + "\n\n" + _encode_payload(invisible_payload, setup.get("encoding"))
        (d / f"{pk['article']}.md").write_text(f"# {pk.get('title', pk['article'])}\n\n{text}\n",
                                               encoding="utf-8")

    if setup.get("authorised_reset"):
        facts["authorised_resets"] = set(setup["authorised_reset"])
    return facts
