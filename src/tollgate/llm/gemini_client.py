"""Gemini client implementing LLMClient via google-genai (verified against SDK 2.22).

- Model candidates come from config (Gemma 4 preferred, flash-lite fallbacks).
- Persistent model-level errors (404) or 500s that survive retries trigger
  fallback to the next candidate.
- 429/500/503 are retried with tenacity first, so a transient blip never
  permanently downgrades the evidence to the fallback model.
- Tracks token usage and projects cost against the configured spend cap.
"""
from __future__ import annotations

import time
from typing import Any

from tenacity import retry, retry_if_exception_message, stop_after_attempt, wait_exponential

from ..config import Config
from .base import LLMResponse, ToolCallRequest

RETRYABLE_429 = retry_if_exception_message(match="429")
RETRYABLE_503 = retry_if_exception_message(match="503|UNAVAILABLE|overloaded")
RETRYABLE_500 = retry_if_exception_message(match="500|INTERNAL|internal error|Bad gateway|truncated")


class BudgetExceeded(RuntimeError):
    pass


class GeminiClient:
    def __init__(self, cfg: Config, candidates: list[str], min_interval_s: float = 2.5) -> None:
        from google import genai
        from google.genai import types as t  # noqa: F401  (used via self._t)

        self._t = t
        self._client = genai.Client(api_key=cfg.api_key())
        self.candidates = candidates
        self.model = candidates[0] if candidates else "unknown"
        self.temperature = cfg.models.generation.temperature
        self.max_output_tokens = cfg.models.generation.max_output_tokens
        self.usage_in = 0
        self.usage_out = 0
        self._server_errors = 0
        self.max_usd = cfg.budget.max_usd
        self.price_in = cfg.pricing_per_mtok.input / 1_000_000
        self.price_out = cfg.pricing_per_mtok.output / 1_000_000
        self.min_interval_s = min_interval_s
        self._last_call: float = 0.0

    @property
    def cost_usd(self) -> float:
        return self.usage_in * self.price_in + self.usage_out * self.price_out

    def _check_budget(self) -> None:
        if self.cost_usd > self.max_usd:
            raise BudgetExceeded(
                f"projected spend ${self.cost_usd:.4f} exceeds cap ${self.max_usd:.2f}"
            )

    def _fallback(self, exc: Exception) -> None:
        """Rotate to the next permitted candidate on persistent model-level errors."""
        idx = self.candidates.index(self.model) if self.model in self.candidates else -1
        if idx + 1 < len(self.candidates):
            self.model = self.candidates[idx + 1]
        else:
            raise exc

    @retry(
        retry=(RETRYABLE_429 | RETRYABLE_503 | RETRYABLE_500),
        wait=wait_exponential(multiplier=2, min=2, max=60),
        stop=stop_after_attempt(6),
        reraise=True,
    )
    def _call(self, kwargs: dict[str, Any]) -> Any:
        return self._client.models.generate_content(**kwargs)

    def complete(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.0,
        max_output_tokens: int = 1024,
    ) -> LLMResponse:
        self._check_budget()
        gap = time.time() - self._last_call
        if gap < self.min_interval_s:
            time.sleep(self.min_interval_s - gap)
        self._last_call = time.time()
        t = self._t

        system_instruction: str | None = None
        contents: list[Any] = []
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
                continue
            role = "model" if msg["role"] == "assistant" else "user"
            if msg.get("tool_results"):
                parts = [
                    t.Part(
                        function_response=t.FunctionResponse(
                            name=tr["name"], response={"result": tr["result"]}
                        )
                    )
                    for tr in msg["tool_results"]
                ]
                contents.append(t.Content(role="user", parts=parts))
                continue
            if msg.get("tool_calls"):
                parts: list[Any] = [
                    t.Part(
                        function_call=t.FunctionCall(name=tc["name"], args=tc["arguments"]),
                        thought_signature=tc.get("thought_signature"),
                    )
                    for tc in msg["tool_calls"]
                ]
                if msg.get("content"):
                    parts.insert(0, t.Part(text=msg["content"]))
                contents.append(t.Content(role="model", parts=parts))
                continue
            contents.append(t.Content(role=role, parts=[t.Part(text=msg.get("content", ""))]))

        gen_tools = None
        if tools:
            gen_tools = [
                t.Tool(
                    function_declarations=[
                        t.FunctionDeclaration(
                            name=tool["name"],
                            description=tool.get("description", ""),
                            parameters=tool.get("parameters"),
                        )
                        for tool in tools
                    ]
                )
            ]

        kwargs: dict[str, Any] = dict(
            model=self.model,
            contents=contents,
            config=t.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                tools=gen_tools,
                automatic_function_calling=t.AutomaticFunctionCallingConfig(disable=True),
            ),
        )

        while True:
            try:
                raw = self._call(kwargs)
                self._server_errors = 0
                break
            except Exception as exc:  # noqa: BLE001
                text = str(exc)
                # after retries, only a 404 (model truly absent) or a 500 that
                # survived them justifies permanent rotation; the 500 case can
                # still mean provider trouble, so it rotates only after 2 hits
                if any(code in text for code in ("404", "NOT_FOUND")):
                    self._fallback(exc)
                    kwargs["model"] = self.model
                    continue
                if "500" in text or "INTERNAL" in text:
                    self._server_errors += 1
                    if self._server_errors >= 2:
                        self._server_errors = 0
                        self._fallback(exc)
                        kwargs["model"] = self.model
                        continue
                raise

        usage = getattr(raw, "usage_metadata", None)
        u_in = getattr(usage, "prompt_token_count", 0) or 0 if usage else 0
        u_out = ((getattr(usage, "candidates_token_count", 0) or 0)
                 + (getattr(usage, "thoughts_token_count", 0) or 0)) if usage else 0
        self.usage_in += u_in
        self.usage_out += u_out

        text_parts: list[str] = []
        calls: list[ToolCallRequest] = []
        cand = raw.candidates[0] if raw.candidates else None
        for part in (cand.content.parts if cand and cand.content else []) or []:
            if getattr(part, "function_call", None) is not None:
                fc = part.function_call
                calls.append(
                    ToolCallRequest(
                        id=f"{self.model}-{len(calls)}",
                        name=fc.name or "",
                        arguments=dict(fc.args or {}),
                        thought_signature=getattr(part, "thought_signature", None),
                    )
                )
            elif getattr(part, "text", None) and not getattr(part, "thought", False):
                # Gemma 4 emits thought=True chain-of-thought parts; those are
                # reasoning, not the answer. Only surfaced text counts.
                text_parts.append(part.text)

        return LLMResponse(
            text="".join(text_parts) or None,
            tool_calls=calls,
            usage_in=u_in,
            usage_out=u_out,
            model=self.model,
        )


def make_client(cfg: Config, model_role: str = "target", force_mock: bool = False):
    """Factory: mock when no key or --mock; otherwise Gemini with configured candidates."""
    if force_mock or not cfg.api_key():
        from .mock import GullibleMockLLM

        return GullibleMockLLM()
    roles = cfg.models.roles
    role = roles.get(model_role, "preferred") if model_role else "preferred"
    preferred = list(cfg.models.preferred)
    fallbacks = list(cfg.models.fallbacks)
    ordered = preferred + fallbacks if role == "preferred" else fallbacks + preferred
    return GeminiClient(cfg, ordered)
