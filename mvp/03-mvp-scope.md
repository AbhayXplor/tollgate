# 03 — MVP Scope and Plan

Three people, same ownership split as `tollgate-docs/10`. What changes is what the
loop owns and one new deliverable (the gate).

---

## Who owns what

**Aadit — Measurement and the Gate**
- Benign suite: all 60 tasks, especially the 20 honest lookalikes (still 60% of the
  intellectual work — still built first, blind, outsider-reviewed)
- Oracles and scorer (`tollgate-docs/07` spec, unchanged)
- **The acceptance gate (G1–G4)** and the pricing step inside the loop
- Final sweep, frontier maths, the report

**Abhay — Attack and the Loop**
- Attack catalogue (~70, six categories, `tollgate-docs/04` spec)
- Mutator, invisible-Unicode work, diagnosis rules
- **Loop driver**: seed rotation, budgets, patch selection from the cause→fix table
- D2 learned bank, ATB metric, exfil server

**Person C — Platform**
- Orin, tools, sandbox, event log, world reset (`tollgate-docs/03` spec, unchanged)
- All six defence layers behind the guard interface
- `runners/base.py` — the single-run path both the loop and the sweep call
- Repo, config system, CI, dashboard

**Interfaces agreed on day one (YAML formats for attacks and benign tasks):**
unchanged, use `tollgate-docs/04` and `05`. That is what lets three people move at once.

---

## Scope decisions for the MVP

**Never cut (the four from the docs, plus one):**
1. The benign suite + the outsider review
2. The oracles and their unit tests
3. The baseline run with no defences
4. The honest limitations section
5. **NEW: the acceptance gate with revert semantics** — it is the innovation criterion;
   without it we are back to being a two-mode measurement project

**Cut order if we fall behind (in this order):**
1. Configurations on the final sweep — fewer points on the curve
2. D4 quarantine — most expensive layer; D2 + D5 + D6 still draw the story
   *(note: without D4, the poisoned-ticket fix story weakens — if the loop demo
   depends on it, cut the dashboard instead and keep D4)*
3. Aggressive patch mode — minimal mode alone still gives the ladder
4. The interactive dashboard — static matplotlib charts still carry the finding

**Explicitly in for the MVP (do not talk ourselves out of these):**
- A5 invisible channel — the demo beat, and it went in-the-wild this month
- A6 scorer attack — the closing twist; it is also the justification for oracle scoring
- Revert semantics on reject — fifteen lines of code, it is the whole story
- Dollarization slide — N tickets/day × lookalike share × bounce rate = the business case

---

## Milestones (compressed)

**M0 — Foundations.** Repo, config system, `.gitignore` + `.env`, YAML formats agreed,
fake world generated, Ollama + hosted API working with a spend cap.
*Done when:* `tollgate run --test hello` logs a tool call.

**M1 — Orin broken on camera.** Full agent loop, sandbox logging, world reset.
*Done when:* we watch Orin email the salary table out, and **record the video** —
it gets harder to reproduce later.

**M2 — Both suites + oracles.** ~70 attacks and ~60 benign tasks loading; outsider
review done; every oracle unit-tested; hand-check 20 runs against human verdicts.
*Done when:* baseline ASR and TCR exist. **Run the 5-config × 20-test pilot sweep
immediately after** — we need to know the Toll is real at M2, not M4.

**M3 — Defences behind the guard.** Six layers, configs load and combine, threshold
dials continuously.
*Done when:* the same test gives different results under different configs, on purpose.

**M4 — The loop with the gate.** Seed rotation, mutation budgets, diagnosis, patch
selection, **pricing step, gate G1–G4, revert on reject**, `loop.jsonl` filling up.
*Done when:* we can show one accepted patch AND one gate-rejected patch with numbers.
This is the moment we find out whether the new story is real.

**M5 — Output.** Final sweep, frontier chart, dashboard (or static charts), report
drafted against `tollgate-docs/12`, dollarization slide, A6 twist built.
*Done when:* an outsider can explain the finding back to us correctly.

**M6 — Stage.** Five-act demo rehearsed 5×, everything pre-computed, backup video
local, wifi-off rehearsal, Q&A owners per area.

---

## Working agreements

Unchanged from `tollgate-docs/10`: nobody edits another's area without asking, one
file per test case, oracle version stamped on every result row and the sweep re-run
if it changes, daily fifteen minutes. Add one:

- **If the gate rules change, the loop re-runs from scratch.** Same discipline as the
  oracle-versioning rule. Gate version stamped in `loop.jsonl`.
