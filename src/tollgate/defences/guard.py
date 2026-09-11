"""Guard interface. The agent loop consults the guard in exactly four places:
on the user's message, before a tool call runs, on content coming back from a
tool, and on the final answer. Baseline = NoopGuard (everything passes). The
defence stack is a Guard built from a config."""
from __future__ import annotations

from typing import Any, Protocol


class Guard(Protocol):
    def check_user_message(self, text: str, ctx: dict[str, Any]) -> tuple[str, str | None]:
        """Return (text_maybe_sanitized, block_reason|None)."""
        ...

    def check_outgoing_tool(self, tool: str, args: dict[str, Any], ctx: dict[str, Any]) -> tuple[bool, str | None]:
        """Return (allowed, block_reason)."""
        ...

    def check_incoming(self, content: str, ctx: dict[str, Any]) -> tuple[str, str | None]:
        """Return (content_maybe_sanitized, block_reason|None)."""
        ...

    def check_outgoing_final(self, text: str, ctx: dict[str, Any]) -> tuple[str, str | None]:
        """Return (text_maybe_sanitized, block_reason|None)."""
        ...


class NoopGuard:
    """Baseline: no defences."""

    def check_user_message(self, text: str, ctx: dict[str, Any]) -> tuple[str, str | None]:
        return text, None

    def check_outgoing_tool(self, tool: str, args: dict[str, Any], ctx: dict[str, Any]) -> tuple[bool, str | None]:
        return True, None

    def check_incoming(self, content: str, ctx: dict[str, Any]) -> tuple[str, str | None]:
        return content, None

    def check_outgoing_final(self, text: str, ctx: dict[str, Any]) -> tuple[str, str | None]:
        return text, None
