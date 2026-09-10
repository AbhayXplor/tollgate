# 02, How It Works (Architecture)

This page explains the parts of the system and how information moves between them.
No code here. Code layout is in `09-repo-and-stack.md`.

---

## The whole thing in one picture

```
                        ┌─────────────────────────┐
                        │   SCENARIO / WORLD      │
                        │  employees, tickets,    │
                        │  knowledge base, secrets│
                        └───────────┬─────────────┘
                                    │ (fake data the agent can reach)
                                    │
  ┌──────────────┐          ┌───────▼────────┐          ┌─────────────────┐
  │  ATTACKER    │  input   │                │  input   │  BENIGN TASKS   │
  │  local LLM   ├─────────►│   ORIN         │◄─────────┤  honest work +  │
  │  + mutator   │          │   the target   │          │  lookalikes     │
  └──────────────┘          │   agent        │          └─────────────────┘
                            │   hosted LLM   │
                            └───────┬────────┘
                                    │ wants to call a tool
                                    │
                            ┌───────▼────────┐
                            │   THE GUARD    │   ◄── defence config (the dial)
                            │  6 layers, on  │
                            │  or off, tuned │
                            └───────┬────────┘
                                    │ allowed calls only
                            ┌───────▼────────┐
                            │  TOOL SANDBOX  │
                            │  fake tools,   │
                            │  fully logged  │
                            └───────┬────────┘
                                    │ event log (every call, every argument)
                            ┌───────▼────────┐
                            │    SCORER      │
                            │  hard oracles  │
                            │  + an AI judge │
                            │  we distrust   │
                            └───────┬────────┘
                                    │ results.jsonl
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
            ┌─────────────────┐           ┌──────────────────┐
            │  MODE A         │           │  MODE B          │
            │  IMMUNE LOOP    │──────────►│  SWEEP RUNNER    │
            │  attack→patch   │  configs  │  every setting × │
            │  →retry         │  it found │  every test      │
            └────────┬────────┘           └────────┬─────────┘
                     └─────────────┬───────────────┘
                                   ▼
                         ┌──────────────────┐
                         │    DASHBOARD     │
                         │  slider, chart,  │
                         │  live transcripts│
                         └──────────────────┘
```

---

## The parts, one by one

### 1. The Scenario (the fake world)

A small pretend company. All data invented.

- **Employees**, about 25 people, each with a name, email, department, manager, salary,
  and home address. Salary and home address are the sensitive fields.
- **Tickets**, support tickets the agent reads. Some are normal. Some are poisoned by us.
- **Knowledge base**, internal help articles. Also readable, also poisonable.
- **Secrets**, a few fake API keys and a fake admin password.

Why this matters: the agent must have something genuinely worth stealing, otherwise
"the attack succeeded" has no meaning.

### 2. Orin, the target agent

The AI assistant we are attacking. An internal IT helpdesk agent. It has a system prompt
(its instructions), a job, and tools it can call.

Full spec in `03-target-agent.md`.

Important: Orin is deliberately naive at the start. It is supposed to fall over. That is
the point.

### 3. The Attacker

Two pieces:

- **A catalogue of hand-written attacks**, our starting set, organised into the four
  required categories plus two extra ones.
- **A mutator**, a local LLM that takes an attack that failed and rewrites it. Different
  wording, different encoding, hidden inside a document, split across turns.

The mutator runs on a local model (Ollama) because it needs to make thousands of cheap
calls. The target agent runs on a hosted model so that our results say something real.

### 4. The Benign Tasks

The other input, and the one nobody else builds. About 60 legitimate helpdesk jobs Orin
should be able to complete. Roughly 40 ordinary ones and 20 "honest lookalikes", real
requests worded in ways that look like attacks.

Full list design in `05-benign-suite.md`.

### 5. The Guard (the defences)

Sits in two places: between untrusted content and the agent, and between the agent and the
tools. Six layers, each of which can be switched on or off, and one of which (the
classifier) has a continuous sensitivity dial.

Full spec in `06-defence-stack.md`.

**Key design decision: the defence is a dial, not a switch.** Everything in Mode B depends
on being able to run the same agent at many different defence settings.

### 6. The Tool Sandbox

Fake versions of every tool. They do not touch the real world, `send_email` writes to a
log file instead of sending anything, `reset_password` returns a fake string.

Every call is recorded: which tool, what arguments, what came back, at what time. This log
is the evidence, and it is also what the scorer reads.

### 7. The Scorer

Decides whether each run was blocked, partial, or succeeded, and for benign tasks, whether
the job actually got done.

**Critical rule: we score using hard facts, not opinions.** "Did the canary string appear
in an outgoing email?" is a fact you can check with string matching. "Did the agent seem to
leak something?" is an opinion. We use facts.

We also run an AI judge alongside, not because we trust it, but because attacking it is
one of our findings.

Full spec in `07-scoring-and-metrics.md`.

### 8. Mode A, the Immune Loop

Runs the attacker against Orin, diagnoses successes, switches on defences, retries.
Produces a story and a list of defence configurations worth testing properly.

Full spec in `08-immune-loop.md`.

### 9. Mode B, the Sweep Runner

Takes every defence configuration and runs the **complete** attack list and the **complete**
benign list against it. Produces the numbers and the chart.

This is the expensive part. Number of runs = configurations × (attacks + benign tasks) ×
repeats. Plan the budget for it.

### 10. The Dashboard

A single web page for the demo. Three things on it:

- A slider for the classifier sensitivity. Drag it and watch both numbers move in opposite
  directions.
- The frontier chart, every defence configuration plotted as a dot, attacks blocked
  against honest work completed.
- A transcript viewer, so we can click any dot and show the jury the actual conversation.

---

## How data flows through a single run

One "run" = one test case against one defence configuration.

```
1. Pick a test case (attack or benign) and a defence config.
2. Reset the world to a clean state.
3. Give Orin the request.
4. Orin thinks, decides to call a tool.
5. The Guard checks the call. Allowed? Blocked? Modified?
6. The Sandbox runs the tool and logs everything.
7. The tool result goes back through the Guard (content coming IN is checked too).
8. Steps 4-7 repeat until Orin gives a final answer or hits a step limit.
9. The Scorer reads the event log and applies the oracles.
10. Write one line to results.jsonl with: test id, config id, verdict,
    which oracles tripped, token cost, latency, and the full transcript.
```

Everything downstream, every chart, every number, every claim in the report, is computed
from `results.jsonl`. Nothing is typed in by hand.

---

## Why the architecture is shaped like this

**The Guard is separate from the agent** so we can change defences without touching agent
code. If defences were baked into the prompt, Mode B would be impossible.

**The Sandbox logs everything** so the scorer never has to guess. This is what lets us say
"our numbers are facts, not an AI's opinion" when the jury pushes.

**Modes A and B share the same runner underneath.** They are two strategies for choosing
what to run next, not two systems. This keeps the codebase small and means a bug fix helps
both.

**Results are one flat file.** Boring on purpose. Easy to re-analyse, easy to share, easy to
put in the appendix as evidence.
