"""Probe the live Gemini API for what this key can actually do.

Per project rule: never assume — ListModels is ground truth. For every Gemma
candidate (and the two permitted fallbacks) we test:
  1. plain generate_content
  2. generate_content with a tool declared (does the model support tool use?)
Writes a verdict table to stdout and results/probe.json.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / ".env")
KEY = os.environ.get("GEMINI_API_KEY")
if not KEY:
    print("FATAL: GEMINI_API_KEY missing"); sys.exit(1)

from google import genai  # noqa: E402
from google.genai import types as t  # noqa: E402

client = genai.Client(api_key=KEY)

FALLBACKS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"]

TOOL = t.Tool(
    function_declarations=[
        t.FunctionDeclaration(
            name="lookup_employee",
            description="Look up an employee record by id.",
            parameters={
                "type": "object",
                "properties": {"employee_id": {"type": "string"}},
                "required": ["employee_id"],
            },
        )
    ]
)

PLAIN_PROMPT = "Reply with exactly: OK"
TOOL_PROMPT = (
    "Use the lookup_employee tool to find employee E-0001. Do not answer in text."
)


def try_plain(model: str) -> tuple[bool, str]:
    try:
        r = client.models.generate_content(
            model=model, contents=PLAIN_PROMPT,
            config=t.GenerateContentConfig(temperature=0.0, max_output_tokens=20),
        )
        txt = (r.text or "").strip()[:30]
        return True, txt
    except Exception as e:  # noqa: BLE001
        return False, str(e).split("\n")[0][:120]


def try_tools(model: str) -> tuple[bool, str]:
    try:
        r = client.models.generate_content(
            model=model, contents=TOOL_PROMPT,
            config=t.GenerateContentConfig(
                temperature=0.0, max_output_tokens=200, tools=[TOOL],
                automatic_function_calling=t.AutomaticFunctionCallingConfig(disable=True),
            ),
        )
        parts = r.candidates[0].content.parts if r.candidates else []
        for p in parts:
            if p.function_call is not None:
                return True, f"tool_call:{p.function_call.name}({dict(p.function_call.args)})"
        return False, "no function_call in response"
    except Exception as e:  # noqa: BLE001
        return False, str(e).split("\n")[0][:120]


def main() -> None:
    print("== Listing models visible to this key ==")
    models = list(client.models.list())
    all_ids = sorted({m.name.lstrip("models/") for m in models})
    gemma = [mid for mid in all_ids if "gemma" in mid.lower()]
    print(f"total models: {len(all_ids)}; gemma-family ids: {gemma if gemma else 'NONE'}")

    candidates: list[str] = []
    seen = set()
    for pref in ["gemma-4"]:
        for mid in gemma:
            if mid.startswith(pref) and mid not in seen:
                candidates.append(mid); seen.add(mid)
    if not gemma:
        print("NOTE: no Gemma ids returned by ListModels -> Gemma 4 unavailable on this key")
    for fb in FALLBACKS:
        if fb in all_ids:
            candidates.append(fb)
        else:
            print(f"NOTE: fallback {fb} not in ListModels output")

    verdicts = {}
    print("\n== Candidate probes ==")
    for mid in candidates:
        ok_p, msg_p = try_plain(mid)
        ok_t, msg_t = (False, "skipped: plain failed") if not ok_p else try_tools(mid)
        verdicts[mid] = {"plain": [ok_p, msg_p], "tools": [ok_t, msg_t]}
        print(f"{mid:35s} plain={'Y' if ok_p else 'N'} tools={'Y' if ok_t else 'N'}"
              f"  | {msg_p if not ok_p else ''}{msg_t if ok_p and not ok_t else ''}"
              f"{(' -> ' + msg_t) if ok_t else ''}")

    out = ROOT / "results" / "probe.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({"all_ids": all_ids, "verdicts": verdicts}, indent=2))
    print(f"\nwritten: {out}")


if __name__ == "__main__":
    main()
