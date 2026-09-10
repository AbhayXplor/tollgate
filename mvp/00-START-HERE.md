# Tollgate MVP — Start Here

**This folder supersedes `tollgate-docs/` where the two disagree.**
`tollgate-docs/` is now the reference library — attack formats, defence details,
oracle specs, repo layout are all still valid. What changed is the *shape of the
system* and the *story we tell*. Both changes live here.

---

## What changed, in one paragraph

The old plan had two modes: Mode A finds defences, Mode B prices them. The new plan
fuses them into **one loop**: break the agent → patch it → **price the patch against
honest work** → accept it only if it pays its Toll, otherwise revert → keep breaking.
A fix is no longer "shipped because it blocks an attack". It is shipped only if it
blocks the attack **without eating the product**. That acceptance gate is the project.

## Why this changed

Two real events made the old framing weaker and this one stronger:

- **June 2026 — Fable 5.** Anthropic shipped a stricter safety classifier and it
  started flagging legitimate security audits as attacks (GitHub issues #66909,
  #66697; users rewording audits as "structural compliance checks" to get through).
  Anthropic said so themselves: the stricter classifier comes at the cost of flagging
  benign requests. **That is the Toll, shipped by the best lab on earth, by accident.**
- **September 3, 2026 — GPT-6 Astra.** OpenAI declares the "AGI era" and *pre-warns*
  about the model's advanced cyber capabilities. Agents are about to be built, patched
  and re-modelled continuously. Nothing in that pipeline checks whether each fix broke
  the product. That check is our product.

The pitch is no longer "nobody publishes the false-alarm rate" (AgentDojo makes that
attackable). The pitch is: **when agents build agents, agent CI is the job — and every
CI gate needs a priced false-positive check that does not exist today. We are that check.**

---

## The one sentence to the jury

> Every team here will show you a guardrail blocking attacks. We built the thing that
> decides whether that guardrail should be allowed to ship — the loop that breaks the
> agent, patches it, prices every patch in lost honest work, and ships only what pays.

## The name still works

A tollgate is a gate you pass only if you pay. So is our acceptance gate: a patch that
cannot pay its Toll does not pass. Same name, sharper meaning.

---

## Files in this folder

| File | What is in it |
|---|---|
| `00-START-HERE.md` | This page |
| `01-the-pitch.md` | The story, the market, the competition, the rubric mapping |
| `02-the-loop.md` | The unified loop and the acceptance gate, specified |
| `03-mvp-scope.md` | What we build, what we cut, who builds it, milestones |
| `04-demo-changes.md` | The new demo beats; what stays, what moves |

## What still comes from `tollgate-docs/`

Nothing below changes. Do not re-litigate it here.

- **Attack suite design** — categories A1–A6, YAML format, writing rules → `tollgate-docs/04`
- **Benign suite design** — the honest lookalikes, the writing rules, the outsider review → `tollgate-docs/05` (still the most important file in the project)
- **Defence stack details** — D1–D6 internals → `tollgate-docs/06`
- **Oracles, metrics, verdicts** — ASR, TCR, Toll, ATB, frontier → `tollgate-docs/07`
- **Repo layout, libraries, CLI** → `tollgate-docs/09`
- **Glossary** → `tollgate-docs/14`

What `02-the-loop.md` replaces: the "two modes" split in `tollgate-docs/00`, `01`, `02`, `08`.
The machinery those files describe (mutator, diagnosis, sweep runner) is all still used —
it is now wired into one loop instead of two phases.
