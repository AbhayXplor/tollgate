"""Orin's agent loop. Standard tool-calling: think -> call tools (through the
guard) -> read results (through the guard) -> repeat -> final answer.
Deterministic settings: temperature 0, hard step cap."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..defences.guard import Guard, NoopGuard
from ..llm.base import LLMClient
from ..world.loader import World
from .prompts import NAIVE_PROMPT
from .sandbox import Sandbox
from .tools import TOOL_SCHEMAS

MAX_STEPS_DEFAULT = 8


@dataclass
class RunResult:
    final_answer: str
    steps: int
    usage_in: int = 0
    usage_out: int = 0
    model: str = "unknown"
    tool_events: list[dict[str, Any]] = field(default_factory=list)


def run_orin(
    client: LLMClient,
    world: World,
    sandbox: Sandbox,
    user_message: str,
    system_prompt: str = NAIVE_PROMPT,
    guard: Guard | None = None,
    max_steps: int = MAX_STEPS_DEFAULT,
    ctx: dict[str, Any] | None = None,
) -> RunResult:
    guard = guard or NoopGuard()
    ctx = ctx or {}
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    usage_in = usage_out = 0
    model = "unknown"
    final = ""

    for step in range(1, max_steps + 1):
        resp = client.complete(messages, tools=TOOL_SCHEMAS)
        usage_in += resp.usage_in
        usage_out += resp.usage_out
        model = resp.model

        if resp.wants_tool:
            sandbox.record_transcript({
                "step": step, "role": "assistant",
                "text": resp.text, "tool_calls": [
                    {"name": tc.name, "arguments": tc.arguments} for tc in resp.tool_calls
                ],
            })
            messages.append({
                "role": "assistant",
                "content": resp.text or "",
                "tool_calls": [{
                    "name": tc.name,
                    "arguments": tc.arguments,
                    "thought_signature": tc.thought_signature,
                } for tc in resp.tool_calls],
            })
            tool_results: list[dict[str, Any]] = []
            for tc in resp.tool_calls:
                allowed, reason = guard.check_outgoing_tool(tc.name, tc.arguments, ctx)
                raw = sandbox.run_tool(tc.name, tc.arguments, blocked_by=None if allowed else reason)
                if allowed:
                    sanitized, in_reason = guard.check_incoming(raw, ctx)
                    raw = sanitized if in_reason is None else f"[CONTENT BLOCKED: {in_reason}]"
                tool_results.append({"name": tc.name, "result": raw})
            messages.append({"role": "user", "tool_results": tool_results})
            continue

        text = resp.text or ""
        final, out_reason = guard.check_outgoing_final(text, ctx)
        if out_reason:
            final = f"[FINAL ANSWER BLOCKED: {out_reason}]"
        sandbox.record_transcript({"step": step, "role": "assistant_final", "text": text})
        return RunResult(
            final_answer=final, steps=step, usage_in=usage_in, usage_out=usage_out,
            model=model, tool_events=sandbox.log.as_dicts(),
        )

    final = "[max steps reached without final answer]"
    sandbox.record_transcript({"step": max_steps, "role": "limit", "text": final})
    return RunResult(
        final_answer=final, steps=max_steps, usage_in=usage_in, usage_out=usage_out,
        model=model, tool_events=sandbox.log.as_dicts(),
    )
