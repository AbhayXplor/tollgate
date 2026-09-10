"""Scripted mock LLM for offline tests and CI.

Configured with a queue of scripted turns; each turn is tool calls and/or a
final text. Tests drive Orin through deterministic multi-step trajectories
(read ticket -> lookup -> send email) with no network. Also the default
provider when GEMINI_API_KEY is absent, so `tollgate run --mock` always works.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .base import LLMResponse, ToolCallRequest


@dataclass
class ScriptedTurn:
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    text: str = ""
    usage_in: int = 120
    usage_out: int = 60


class MockLLM:
    model = "mock-1"

    def __init__(self, script: list[ScriptedTurn] | None = None) -> None:
        self.script: list[ScriptedTurn] = list(script or [])
        self.calls: list[dict[str, Any]] = []

    def complete(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.0,
        max_output_tokens: int = 1024,
    ) -> LLMResponse:
        self.calls.append({"messages": messages, "tools": tools or []})
        if not self.script:
            return LLMResponse(
                text="(mock: script exhausted: refusing everything)",
                usage_in=10,
                usage_out=10,
                model=self.model,
            )
        turn = self.script.pop(0)
        return LLMResponse(
            text=turn.text or None,
            tool_calls=[
                ToolCallRequest(id=f"mock-{i}", name=t["name"], arguments=t.get("arguments", {}))
                for i, t in enumerate(turn.tool_calls)
            ],
            usage_in=turn.usage_in,
            usage_out=turn.usage_out,
            model=self.model,
        )
