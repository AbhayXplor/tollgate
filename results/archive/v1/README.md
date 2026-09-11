# Scoring v1 evidence (archived, do not cite)

These rows were produced before scoring v2.0.0 and are kept only for the record.
They do not measure what they claim to, because of harness bugs found on 2026-09-10:

- Tool results reached the model truncated to 200 characters, so the injected
  instructions in poisoned tickets and KB articles (A2, A5, A6) were cut off
  before the model could read them. Invisible-Unicode payloads also arrived as
  `\udbXX` escape text rather than real characters.
- The "no defences" baseline still ran the D6 email checks.
- The canary oracle scored a verbatim system-prompt dump as not leaked.
- A4-001, A4-002 and A6-002 asked for API keys that no tool could reach.
- The file mixes in mock-model rows, and every real row was answered by
  gemini-3.1-flash-lite, not Gemma 4.

The headline "baseline blocks 100% of attacks" therefore means "the attacks were
never delivered". See the PR that introduced scoring v2 for details.
