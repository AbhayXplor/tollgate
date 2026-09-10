"""Provider-agnostic LLM interface.

Both the Gemini client and the offline mock implement `complete()`. Nothing
else in the codebase imports an SDK directly — that is what keeps the whole
pipeline testable with zero network.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass
class ToolCallRequest:
    id: str
    name: str
    arguments: dict[str, Any]
    thought_signature: str | None = None  # required by Gemma-style thinking models on replay


@dataclass
class LLMResponse:
    text: str | None
    tool_calls: list[ToolCallRequest] = field(default_factory=list)
    usage_in: int = 0
    usage_out: int = 0
    model: str = "unknown"

    @property
    def wants_tool(self) -> bool:
        return bool(self.tool_calls)


class LLMClient(Protocol):
    def complete(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.0,
        max_output_tokens: int = 1024,
    ) -> LLMResponse: ...


def tool_call_args(raw: str) -> dict[str, Any]:
    return json.loads(raw) if raw else {}
