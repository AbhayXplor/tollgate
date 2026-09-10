# 12, The Written Report

Structure for the jury submission. Every graded item from the brief has a home here.

---

## Mapping to what is graded

| The brief asks for | Where it lives |
|---|---|
| A target agent with 2+ tools, one touching sensitive data | Section 3 |
| Attack suite, 4+ categories | Section 4 |
| Automated runner, blocked/partial/succeeded, transcripts as evidence | Section 5 |
| At least one defence, before/after on the same suite | Section 6 |
| Success rate by category | Section 7 |
| The most dangerous successful attack | Section 8 |
| Remediation tied to each finding | Section 9 |
| Honest note on what the defence does not stop | Section 10 |

Sections 7 to 11 are where we go past the requirement.

---

## Structure

### 1. Summary, one page

The finding, stated plainly, with the three numbers that matter.

> Prompt-injection guardrails are published with a block rate and no false-alarm rate. We
> built an AI helpdesk agent, seventy attacks, sixty legitimate tasks, and six defence
> layers, and measured both numbers across roughly fifty configurations. At the sensitivity
> that blocks 95% of attacks, the agent also refuses 33% of legitimate helpdesk work, and
> almost all of that loss is concentrated in honest requests that are worded like attacks.

Write this last. Rewrite it four times.

### 2. The problem

Why prompt injection is unsolved. Why an agent cannot separate data from instructions. Why
the standard answer is a filter, and what question the standard answer never answers.

Short. Two or three paragraphs. The jury already knows this; we are showing we understand
it, not teaching it.

### 3. The target agent

Orin. Its job, its system prompt, its five tools, the fake world it lives in.

State clearly that all data is invented and everything runs on our own machines.

### 4. The attack suite

The six categories, with counts and a worked example from each. The full catalogue goes in
the appendix.

Highlight the two categories that are ours: the invisible channel, and attacking the scorer.

### 5. How we score

**Make this section stronger than it needs to be.** It is the foundation of every number,
and it is where a practitioner jury will probe.

- The oracles, listed, with what each one checks
- Why we do not use an AI judge as the primary scorer
- How partial verdicts are decided, and how many runs needed a judgement call
- Reproducibility: temperature 0, three repeats, world reset, fixed seeds, spread reported

### 6. The defences

The six layers, what each one does, and where it sits. The configuration format. The idea
that a defence is a dial rather than a switch, and why that matters for what follows.

### 7. Results, attacks

- Baseline attack success rate, overall and by category
- The same after each defence layer, individually
- The same for the combined stacks
- Attempts-to-break from the immune loop

Charts, not walls of numbers. Every chart generated from `results.jsonl`.

### 8. Results, the cost

**The section nobody else will have.**

- Task completion rate at every configuration
- Split into ordinary work and honest lookalikes, this is the graph that carries the paper
- The Toll for each configuration
- Security bought per point of Toll, which is how we rank defences honestly
- The frontier chart, with the dominated configurations called out by name

### 9. The immune loop

The attack → diagnose → patch → retry story, with the round-by-round timeline.

Be precise about what it does and does not do: it selects from six known layers using a
fixed cause-to-fix mapping, and one layer genuinely learns by adding successful attacks to
its memory. It does not invent defences. Saying this plainly is worth more than overclaiming.

### 10. The most dangerous attack

The brief asks for one. Pick the invisible-Unicode ticket that exfiltrates the salary table
through a Markdown image URL.

Why this one:

- It requires no access to the system at all, anyone who can open a support ticket can run it
- It is invisible to every human in the review chain
- It leaves through a channel that looks like ordinary output
- It defeats the two most common defences deployed today: prompt hardening and human review

Full transcript, tool log, and the exfil server capture.

### 11. What our defences do not stop

**The most important section in the report.** Numbers, not hedging.

- Direct injection is untouched by quarantine, quarantine protects content routes only
- The canary catches exact copies of the system prompt; paraphrase or translation walks past
- Capability gating does nothing against attacks that stay within the allowed tools
- The classifier can be defeated by novel phrasings; our attempts-to-break number is how
  much effort that takes, not proof that it cannot be done
- Encoded exfiltration survives DLP when the data is described rather than quoted
- Our attacker is one mutation engine on one model; a human attacker with time will do better

Then the honest overall statement: **no configuration we tested blocked everything, and every
configuration that blocked most things cost real work.**

### 12. Recommendations

What we would actually tell a company deploying an agent.

- Capability gating first. It is cheap, it is deterministic, and it cannot be talked around
- Quarantine untrusted content rather than filtering it, where the task allows
- Canary tokens for detection, understanding they only catch exact leaks
- Pick a classifier threshold from a curve you measured on your own workload, not from a
  vendor's default
- Measure your own false-alarm rate before shipping, on legitimate requests that look
  suspicious, and here is our list to start from

### 13. Limitations and future work

One model family. One agent design. Our lookalike list is a first attempt and is certainly
incomplete. The attacker is automated, not human.

Future: run the sweep across multiple model families and see whether the Toll is a property
of guardrails in general or of one model.

### Appendices

- A: Full attack catalogue
- B: Full benign task list, including the outsider review results
- C: Selected transcripts as evidence
- D: `results.jsonl` schema and how to reproduce every figure
- E: Configuration definitions

---

## How to write it

**Every number comes from `results.jsonl`.** If a number is typed by hand, it is wrong or it
will become wrong.

**State the limitation before the jury finds it.** Every weakness we name ourselves is a
weakness that cannot be used against us in Q&A. This is the single highest-return habit in
technical writing.

**Short sentences. Ordinary words.** The jury is reading many submissions. Being easy to read
is a competitive advantage, not a compromise.

**Charts over tables.** One good chart beats a page of numbers. Put the tables in the
appendix for the person who wants to check.
