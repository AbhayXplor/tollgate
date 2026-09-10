"""Fake tools with complete event logging. The log is the evidence: if it is not
logged, it did not happen. Sensitive returns are also recorded so oracles can
check what Orin actually received vs what it sent out.
"""
from __future__ import annotations

import json
import secrets as pysecrets
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ..world.loader import World

# What the model receives from one tool call. Generous on purpose: the v1
# harness truncated to 200 chars and silently cut every injection out of the
# tickets it was supposed to test. The log keeps a short summary; the model
# gets the real content.
MAX_RESULT_CHARS = 4000
SUMMARY_CHARS = 200


@dataclass
class ToolEvent:
    step: int
    tool: str
    arguments: dict[str, Any]
    result_summary: str
    blocked: bool = False
    block_reason: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "step": self.step, "tool": self.tool, "arguments": self.arguments,
            "result_summary": self.result_summary, "blocked": self.blocked,
            "block_reason": self.block_reason,
        }


@dataclass
class EventLog:
    events: list[ToolEvent] = field(default_factory=list)

    def add(self, event: ToolEvent) -> None:
        self.events.append(event)

    def tool_calls(self, name: str | None = None) -> list[ToolEvent]:
        return [e for e in self.events if e.tool == name] if name else list(self.events)

    def as_dicts(self) -> list[dict[str, Any]]:
        return [e.as_dict() for e in self.events]


class Sandbox:
    """Executes (or blocks) tool calls; every attempt lands in the event log."""

    def __init__(self, world: World, transcripts_dir: Path | None = None) -> None:
        self.world = world
        self.log = EventLog()
        self._step = 0
        self._transcript: list[dict[str, Any]] = []
        self._transcripts_dir = transcripts_dir

    # -- called by the agent loop ------------------------------------------
    def run_tool(self, name: str, args: dict[str, Any], blocked_by: str | None = None) -> str:
        """Run one tool call. `blocked_by` set => guard refused; log and return refusal."""
        self._step += 1
        if blocked_by:
            event = ToolEvent(
                step=self._step, tool=name, arguments=args,
                result_summary="", blocked=True, block_reason=blocked_by,
            )
            self.log.add(event)
            return f"[BLOCKED by guard: {blocked_by}]"

        try:
            result = self._dispatch(name, args)
        except Exception as exc:  # noqa: BLE001: sandbox never crashes the loop
            result = {"error": str(exc)}
        # ensure_ascii=False: invisible Unicode (tag chars, zero-widths) must reach
        # the model as real code points, not as "\udb40..." escape text.
        full = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False)
        self.log.add(ToolEvent(step=self._step, tool=name, arguments=args,
                               result_summary=full[:SUMMARY_CHARS]))
        self._transcript.append({"step": self._step, "role": "tool", "tool": name,
                                 "result": full[:MAX_RESULT_CHARS]})
        return full[:MAX_RESULT_CHARS]

    def record_guard_block(self, channel: str, reason: str, text: str) -> None:
        """A guard refusal that happened outside a tool call (e.g. the user message)."""
        self._step += 1
        self.log.add(ToolEvent(step=self._step, tool=f"guard:{channel}",
                               arguments={"text": text[:SUMMARY_CHARS]}, result_summary="",
                               blocked=True, block_reason=reason))

    def record_transcript(self, entry: dict[str, Any]) -> None:
        self._transcript.append(entry)

    def dump(self, run_id: str) -> dict[str, Any]:
        if self._transcripts_dir:
            self._transcripts_dir.mkdir(parents=True, exist_ok=True)
            (self._transcripts_dir / f"{run_id}.json").write_text(
                json.dumps({"run_id": run_id, "tool_events": self.log.as_dicts(),
                            "transcript": self._transcript}, indent=2, default=str)
            )
        return {"run_id": run_id, "tool_events": self.log.as_dicts()}

    # -- the actual fake tools ---------------------------------------------
    def _dispatch(self, name: str, args: dict[str, Any]) -> Any:
        w = self.world
        if name == "read_ticket":
            t = w.read_ticket(str(args.get("ticket_id", "")))
            return t if t else {"error": "ticket not found"}
        if name == "search_kb":
            hits = w.search_kb(str(args.get("query", "")))
            return hits if hits else {"results": "no matching articles"}
        if name == "lookup_employee":
            e = w.find_employee(str(args.get("query", "")))
            return e if e else {"error": "employee not found"}
        if name == "reset_password":
            emp = w.find_employee(str(args.get("employee_id", "")))
            if not emp:
                return {"error": "employee not found"}
            temp = f"Tmp-{pysecrets.token_hex(4)}-{pysecrets.token_hex(4)}"
            return {"employee_id": emp["employee_id"], "temporary_password": temp,
                    "expires_hours": 24}
        if name == "send_email":
            return {"status": "sent (sandbox)", "to": args.get("to"),
                    "subject": args.get("subject")}
        return {"error": f"unknown tool {name}"}
