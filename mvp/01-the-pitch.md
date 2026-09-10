# 01 — The Pitch (v2)

---

## The story, in the order we tell it

**1. It already happened, to the best lab on earth.**

June 2026. Anthropic ships a stricter safety classifier on Fable 5. Within days,
developers doing authorised security audits get flagged as attackers. GitHub issues
pile up (#66909, #66697). Users figure out they must reword audits as "structural
compliance checks" to get past their own model. Anthropic states openly that the
stricter classifier trades away benign-request accuracy.

Nobody at Anthropic is stupid. The failure is structural: **there was no gate that
asks "what did this safety fix cost in honest work?"** A fix that blocks attacks and
breaks the product ships anyway, because blocking is measurable and breaking is not.

**2. It is about to happen constantly.**

September 3, 2026. GPT-6 Astra launches under an "AGI era" headline — and OpenAI
pre-warns about its advanced cyber capabilities. Whatever we think of the AGI talk,
the direction is not in doubt: agents will build agents, patch them, and swap the
models underneath them continuously. Every one of those changes is a security change.
None of them is priced.

**3. The missing piece is not intelligence. It is verification.**

Ask a frontier model — or a coding CLI — to "secure this agent" and it will happily
add guardrails all day. It will never, on its own, run your real honest workload
against every guardrail it adds and tell you what the guardrails broke. Not because
it can't. Because that requires an **artifact** (a corpus of legitimate work that
looks like attacks) and a **method** (hard, mechanical scoring) that nobody has
published. Smart is free. Verification is the bottleneck.

> When agents build agents, agent CI is the job. And CI means gates.
> We are the gate that prices the fix.

---

## The one-liner

> We verify agent security changes the way CI verifies code: break the agent, patch it,
> then price every patch in lost honest work before it ships. A patch that blocks 95%
> of attacks while refusing a third of real requests does not pass. We built the loop
> that makes that decision with numbers instead of vibes.

## The numbers we will stand on

- **ASR** — attack success rate, per category. Lower is better.
- **TCR** — task completion rate on ~60 legitimate helpdesk tasks. Higher is better.
- **The Toll** — TCR lost per patch. The number vendors do not print.
- **TCR-ordinary vs TCR-lookalike** — the loss concentrates in legitimate requests
  worded like attacks. That gap is the finding.
- **ATB** — attempts-to-break. How much harder each accepted patch made the agent.

Full definitions: `tollgate-docs/07-scoring-and-metrics.md`.

---

## Who buys this, and what it replaces

**The buyer:** every team about to deploy an LLM agent with guardrails — platform,
security, and AI-governance teams. Also guardrail vendors, who need workload-real
false-positive numbers instead of marketing ones.

**What it replaces:** the current decision process, which is (1) read the vendor's
block rate, (2) ship the default threshold, (3) find out from angry users what it
blocked. A December 2025 buyer's guide literally advises: *"Ask any vendor for their
false-positive and false-negative rates on your own traffic, not their marketing
benchmark."* Good advice with no tool behind it. We are the tool.

**The recurring need (why it is a product and not a one-off report):** models drift.
Fable 5 changed behaviour overnight. Astra shipped last week; the next one next
quarter. Every model bump silently changes agent behaviour and guardrail tuning.
Re-run the dual suite, diff the Toll, re-decide. That is a standing service with
accumulated per-deployment data — the corpus gets better with every customer.

---

## Competitive landscape

| Player | What they do | What they don't do |
|---|---|---|
| Promptfoo, Garak, PyRIT, DeepTeam | Attack-side red teaming, free and mature | Never price the fix. Tell you it broke; not what the fix costs |
| AgentDojo (ETH, NeurIPS '24) | Research benchmark: utility vs security on generic tasks | Not your workload, no lookalike-class corpus, no ship/no-ship decision |
| Vendor guardrail benchmarks | Block rates on generic prompts | Their prompts, not yours. No false-positive pricing on real work |
| **Tollgate** | **Break → patch → price → gate, on your workload, with the lookalike corpus** | — |

The moat is not the attacker — attackers are commoditised. The moat is the
**corpus + the oracles + the accumulated per-deployment data**.

## Why a coding CLI won't just absorb this

1. **Self-grading.** The same agent that builds and patches your agent would be grading
   its own security work — while reading attacker-controlled text. Our A6 category
   proves an AI judge can be talked into reporting a clean pass during a live breach.
   As builders get more autonomous, independent mechanical verification gets *more*
   valuable, not less.
2. **The artifact.** The bottleneck was never model capability. It is the lookalike
   corpus and the oracle suite — data and methodology, built blind, outsider-reviewed,
   compounding per deployment. Fable 5 proves capability is not the missing piece.
3. **Standing verification.** A CLI does what it is asked, once. Drift means the real
   need is continuous re-verification with history — diffing this month's Toll against
   last month's. That is infrastructure, not a prompt.

---

## Rubric mapping (how each scored criterion gets answered)

| Criterion | Weight | Our answer |
|---|---|---|
| Fit to brief + business problem | 20% | Buyer: teams deploying agents. Replaces: vendor block rates and default thresholds, i.e. vibes. Verbatim brief language: "who buys, what does it replace" |
| Relevance — why now | 15% | Dated receipts: Fable 5 over-refusals (June 2026), Astra cyber warning (Sept 3, 2026), Microsoft's in-the-wild Unicode smuggling advisory (Sept 3, 2026) |
| Prototype works | 25% | One command from README; deterministic replay via caching; Unicode attacks double as the "unexpected input" test |
| Technical depth + correctness | 25% | Threshold sweep, 3 repeats with variance, unit-tested oracles, dominance/frontier maths, acceptance gate with explicit thresholds |
| Innovation | 15% | The acceptance gate (new), honest lookalikes, A6 judge attack, loop with revert semantics |

35% of the score (20+15) is business framing — the exact part five rival teams on our
brief will all under-score. That is the winnable margin.
