# 10, Build Plan and Work Split

Three people. The split is chosen so that each person owns a piece that can be built and
tested without waiting on the others.

---

## Who owns what

### Person A, Aadit, Measurement
**Owns the thing the project is judged on.**

- The benign suite: all 60 tasks, especially the 20 honest lookalikes
- `scoring/oracles.py` and `scoring/scorer.py`
- `runners/sweep.py`, Mode B
- `report/metrics.py`, ASR, TCR, Toll, efficiency, the frontier calculation
- The written report

Why this pairing: the person who defines what "success" means should also be the person who
computes the final numbers. It keeps the definitions honest.

### Person B, Abhay, Attack
**Owns the offensive side and the loop.**

- The attack catalogue: all 70 attacks across six categories
- `attacks/mutator.py`, the rewriting engine
- `attacks/invisible.py`, the Unicode hiding work
- `runners/immune.py`, Mode A, including diagnosis and patch selection
- The learned bank feature inside D2
- The ATB metric
- `exfil_server/server.py`

### Person C, Platform
**Owns everything the other two build on top of.**

- `agent/`, Orin, the tools, the sandbox, the event log
- `world/`, the fake company data and the reset logic
- `defences/`, all six layers behind one interface
- `runners/base.py`, the shared single-run path
- The dashboard
- Repo setup, config system, CI, tests

Person C is on the critical path at the start, nobody can test anything until the agent and
sandbox exist. So C builds first, and A and B write content (attacks, benign tasks) against
the agreed file formats while waiting.

**Agree the YAML formats on day one.** That is what lets three people work in parallel
instead of in a queue.

---

## Milestones

### M0, Foundations
*Everyone*

- Repo created, Python environment, config system, `.gitignore` with `.env` in it
- **The YAML formats for attacks and benign tasks agreed and written down**
- Fake company data generated: 25 employees, 20 tickets, 10 KB articles, secrets file
- Ollama installed and a local model pulled
- Hosted model API access working, spend limit set

**Done when:** everyone can run `tollgate run --test hello` and see a logged tool call.

### M1, Orin exists and can be broken
*Person C leads*

- Orin runs the full tool loop against the fake world
- Sandbox logs every call and argument
- World resets cleanly between runs
- Three hand-written attacks succeed against it manually

**Done when:** we can watch Orin email the salary table to an outside address. Record this
video now, it is demo material and it will get harder to reproduce later.

### M2, The two suites
*Person A and Person B in parallel*

- All ~70 attacks written and loading
- All ~60 benign tasks written and loading
- **The outsider review of the benign suite is done**, someone not on the team confirms
  every task is unarguably legitimate
- All oracles implemented and unit tested

**Done when:** `tollgate run` gives a correct verdict on every test with no defences on.
This gives us our baseline ASR and TCR.

### M3, The defences
*Person C leads, Person B builds the learned bank*

- All six layers implemented behind one interface
- Configurations load and combine correctly
- The classifier threshold works as a continuous dial
- Quick sanity check: turning on D6 stops the obvious data theft

**Done when:** the same test gives different results under different configs, on purpose.

### M4, Both modes running
*Person B on Mode A, Person A on Mode B*

- The immune loop runs end to end and writes discovered configurations
- The sweep runs across all configurations with three repeats
- `results.jsonl` filling up with real data
- Caching and retries working, so a long sweep survives a network hiccup

**Done when:** we have enough results to draw the first real frontier chart. **This is the
moment we find out whether the finding is real.** If the Toll turns out to be tiny, we need
to know now, while there is still time to dig into the lookalike subset.

### M5, The output
*Person A leads the report, Person C leads the dashboard*

- Dashboard: slider, frontier chart, transcript viewer
- All report figures generated from `results.jsonl`
- The written report drafted against the required structure
- The A6 scorer attack built and working, the closing twist

**Done when:** someone outside the team can read the report and explain the finding back to
us correctly.

### M6, The stage
*Everyone*

- The five-act demo rehearsed end to end, at least five times
- Everything pre-computed; nothing that must call an API live
- The exfil server demo working reliably on the presenting laptop
- A backup video of the whole demo, on the laptop, not in the cloud
- Q&A practice: each person takes the hardest questions on their own area

**Done when:** we can run the demo with the wifi switched off.

---

## Order of work, and why

**Benign suite before defences.** If we write benign tasks after seeing what our filter
blocks, we will unconsciously write tasks that pass. That would quietly destroy the finding
and we would never notice. Write them blind, first.

**Oracles before the sweep.** A bug in an oracle makes every number wrong, and the sweep is
expensive. Test the measuring equipment before running the experiment.

**Baseline before defences.** We cannot compute the Toll without knowing what Orin completes
with nothing in the way.

**One full end-to-end run early, even if it is tiny.** Three attacks, three benign tasks, two
configs. Getting the whole pipeline connected early surfaces integration problems while they
are still cheap.

---

## Working agreements

- **Nobody edits another person's area without asking.** The interfaces between areas are
  agreed at M0 and changed by conversation, not by commit.
- **Every attack and benign task is one file.** Merge conflicts on a YAML directory are
  painless. Merge conflicts in one giant file are not.
- **If an oracle changes, the whole sweep is re-run.** No mixing results from different
  scoring rules. Tag results with a scoring version.
- **Daily fifteen minutes.** What I did, what I am doing, what is blocking me. Nothing else.

---

## What to do if we fall behind

Cut in this order:

1. **Cut configurations, not tests.** Fewer points on the chart is fine. A smaller attack or
   benign suite weakens the actual finding.
2. **Cut D4 quarantine.** It is the most expensive layer to build and run, and D2 alone
   draws the main curve.
3. **Cut Mode A's aggressive patch mode.** Minimal mode alone still gives the story.
4. **Cut the interactive dashboard**, keep static charts. The finding does not need a slider.

Never cut: the benign suite, the oracles, the baseline run, the honest limitations section.
Those four are the project.
