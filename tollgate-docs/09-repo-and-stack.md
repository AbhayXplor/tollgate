# 09 — Repo Layout and Tech Stack

---

## Tech choices

**Language: Python 3.11+.** The AI, embeddings, and data-analysis libraries all live here.
Nothing else is close for this project.

**Dashboard: a single static HTML page** with vanilla JavaScript and one chart library. No
build step, no framework, no node_modules. It reads the results file and draws. This keeps
the demo bulletproof — the thing most likely to fail on stage is a dev server, so we do not
have one.

### Libraries

| What | Library | Why |
|---|---|---|
| Model calls | `litellm` | One interface for hosted models and local Ollama. Swap models by changing a string. |
| Local models | Ollama | Free, offline, runs the attacker loop |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) | Small, fast, local, free |
| Data shapes | `pydantic` | Catches malformed test definitions early |
| Config and tests | `pyyaml` | Human-editable attack and task files |
| CLI output | `rich` | Readable progress during long sweeps |
| Analysis | `pandas` | Reading results.jsonl and computing metrics |
| Charts (report) | `matplotlib` | Static figures for the written report |
| Charts (dashboard) | Chart.js, vendored locally | No internet dependency on stage |
| Testing | `pytest` | The oracles especially need tests |
| Retries | `tenacity` | API calls fail; do not lose a 3-hour sweep to one timeout |

**Vendor the chart library.** Do not load it from a CDN. Conference wifi is a known enemy.

---

## Folder layout

```
tollgate/
├── README.md
├── pyproject.toml
├── .env.example                 API keys - NEVER commit the real .env
├── .gitignore
│
├── docs/                        <- these planning files
│
├── config/
│   ├── default.yaml             base settings: models, limits, paths
│   ├── models.yaml              which model for target / attacker / judge
│   ├── configs/                 hand-written defence configurations
│   │   ├── cfg-baseline.yaml
│   │   ├── cfg-d2-sweep.yaml
│   │   └── cfg-full.yaml
│   └── discovered/              configurations found by the immune loop
│
├── data/
│   ├── employees.json           25 fake employees (salary, address)
│   ├── secrets.json             fake API keys and admin password
│   ├── tickets/
│   │   ├── clean/
│   │   └── poisoned/
│   └── kb/
│       ├── clean/
│       └── poisoned/
│
├── src/tollgate/
│   ├── __init__.py
│   ├── cli.py                   entry point: tollgate run | sweep | immune | report
│   │
│   ├── agent/
│   │   ├── orin.py              the agent loop
│   │   ├── prompts.py           system prompts, plain and hardened
│   │   ├── tools.py             tool definitions and schemas
│   │   └── sandbox.py           fake tool implementations + event logging
│   │
│   ├── world/
│   │   ├── loader.py            loads the fake company data
│   │   └── reset.py             restores a clean world before each run
│   │
│   ├── attacks/
│   │   ├── suite.py             loads and validates attack YAML
│   │   ├── catalogue/
│   │   │   ├── a1_direct/
│   │   │   ├── a2_indirect/
│   │   │   ├── a3_tool_misuse/
│   │   │   ├── a4_exfiltration/
│   │   │   ├── a5_invisible/
│   │   │   └── a6_scorer/
│   │   ├── mutator.py           rewrites failed attacks (local model)
│   │   └── invisible.py         unicode hiding and revealing helpers
│   │
│   ├── benign/
│   │   ├── suite.py
│   │   └── catalogue/
│   │       ├── b1_ordinary/
│   │       └── b2_lookalikes/
│   │
│   ├── defences/
│   │   ├── guard.py             assembles the stack from a config
│   │   ├── d1_hardening.py
│   │   ├── d2_classifier.py     the dial + the learned bank
│   │   ├── d3_canary.py
│   │   ├── d4_quarantine.py
│   │   ├── d5_capability.py
│   │   └── d6_dlp.py
│   │
│   ├── scoring/
│   │   ├── oracles.py           the hard checks - HEAVILY TESTED
│   │   ├── scorer.py            turns a run into a verdict
│   │   └── judge.py             the AI judge we deliberately distrust
│   │
│   ├── runners/
│   │   ├── base.py              runs one test against one config
│   │   ├── sweep.py             Mode B
│   │   └── immune.py            Mode A
│   │
│   └── report/
│       ├── metrics.py           ASR, TCR, Toll, ATB, frontier
│       ├── figures.py           matplotlib charts for the written report
│       └── build.py             generates the HTML/PDF report
│
├── dashboard/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── vendor/chart.min.js
│
├── results/
│   ├── results.jsonl            every run, ever
│   └── transcripts/
│
├── exfil_server/
│   └── server.py                catches the demo's stolen data over HTTP
│
└── tests/
    ├── test_oracles.py          the most important test file in the repo
    ├── test_defences.py
    ├── test_invisible.py
    └── test_suites.py           validates every YAML file loads correctly
```

---

## What the important files do

**`agent/sandbox.py`** — the fake tools, and the event log. Everything downstream depends on
this log being complete and accurate. If a tool call is not logged, it did not happen as far
as our results are concerned.

**`defences/guard.py`** — takes a configuration and builds the layer stack. Every layer has
the same shape: `check_incoming(content)` and `check_outgoing(tool_call)`. Adding a seventh
defence later means writing one file, not editing five.

**`scoring/oracles.py`** — the most important file in the repo. Every number we publish comes
from these functions. They must be simple, obvious, and covered by tests. If an oracle has a
bug, the entire project is wrong and we would not know.

**`runners/base.py`** — runs one test against one config and writes one result line. Both
modes call it. Keeping this single is what stops Mode A and Mode B from drifting apart.

**`attacks/invisible.py`** — encodes text into Unicode tag characters and decodes it back.
Small file, big demo payoff. Also needs a `reveal()` helper so we can show the audience
what was hidden.

**`exfil_server/server.py`** — a tiny HTTP server that logs incoming requests and prints them
large on screen. This is what makes the stolen data arrive live during the demo. Twenty
lines of code, and it is the most memorable twenty seconds of the presentation.

---

## Command line interface

```bash
# one test, one config - for development
tollgate run --test A2-007 --config cfg-baseline

# Mode A: the immune loop
tollgate immune --seeds all --budget 25 --mode minimal

# Mode B: the full sweep
tollgate sweep --configs config/configs config/discovered --repeats 3

# analysis and report
tollgate report --out report/
tollgate dashboard          # serves the static page against results.jsonl
```

---

## Config over code

Nothing important is hard-coded. Model names, thresholds, budgets, file paths, the canary
string — all in `config/`. Reasons:

- We can re-run everything against a different model by changing one line
- The jury can see exactly what settings produced which numbers
- Three people can work at once without conflicting on the same constants

---

## Git discipline

- **Never commit `.env`.** Put it in `.gitignore` on day one, before any key exists.
- **Do commit `results.jsonl`.** It is our evidence.
- Branch per person, small pull requests, one reviewer.
- Tag the exact commit that produced the numbers in the submitted report. If the jury asks
  "can you reproduce this", the answer is a commit hash.
