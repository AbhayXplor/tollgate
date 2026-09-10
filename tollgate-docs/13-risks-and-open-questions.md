# 13 — Risks and Open Questions

Written down so we notice them early instead of discovering them late.

---

## Risk 1 — The Toll turns out to be small

**The risk:** we run the sweep and the classifier blocks 95% of attacks while only costing
3% of legitimate work. The headline finding evaporates.

**How likely:** possible, but unlikely if the benign suite is built properly. Simple
embedding classifiers are blunt instruments and the lookalikes are designed to sit exactly
in the overlap.

**What we do about it:**
- Report the lookalike subset separately. Even if the overall Toll is small, the effect on
  the hard subset will be visible, and that is still a real finding.
- If the effect is genuinely small, the honest headline becomes: *"the guardrail is cheaper
  than expected on ordinary work but concentrates its damage on a specific class of
  legitimate request, which is a third of a real helpdesk's day."* Still worth saying.
- Worst case, the finding inverts: *"the cost is lower than we predicted, and here is why
  the fear of guardrails is overstated."* Also publishable, also honest.

**Detection:** we know at M4. Build a small pilot sweep early — five configs, twenty tests —
so we get an early signal rather than finding out at the end.

---

## Risk 2 — The immune loop converges immediately

**The risk:** the first patch stops everything, there is no round three, and the loop story
collapses into a static before/after.

**What we do about it:** covered in `08-immune-loop.md`. Generous mutation budget, invisible
character mutations included, minimal patch mode, seeds from all six categories.

**If it happens anyway:** report it as a result. *"Our defence stack closed every route our
automated attacker found within its budget. Here is what a human attacker would still have,
and here is the attempts-to-break number that shows how much harder it got."*

---

## Risk 3 — Cost

**The risk:** ~18,000 agent runs on a hosted model. At even a fraction of a cent per run this
adds up, and it is easy to burn the budget on a sweep with a bug in it.

**What we do about it:**
- Mutator and embeddings run locally. Free.
- Cache results by (test, config, repeat index). A re-run costs nothing.
- Hard spend limit on the API key. Set it before the first sweep, not after.
- Pilot sweeps on a cheap model. One final sweep on the good model for the report.
- Log running cost during the sweep so we can see it climbing.

**Open question:** exact budget. Someone should price a single run early and multiply.

---

## Risk 4 — A bug in an oracle

**The risk:** an oracle is wrong, every number in the project is wrong, and nothing looks
broken.

This is the most dangerous risk in the project because it is silent.

**What we do about it:**
- Unit tests for every oracle, including deliberately tricky cases
- Hand-check twenty runs against the automated verdict early on. If the human and the
  machine disagree, find out why before running the sweep.
- Version the scoring rules. Never mix results scored under different versions.

---

## Risk 5 — The demo fails on stage

**What we do about it:**
- Nothing on stage calls an API. Everything pre-computed.
- Chart library vendored locally, no CDN.
- Backup video on the local disk. Rehearse the demo with wifi off.
- The exfil server runs on localhost, not over the network.
- Rehearse five times, all the way through, including the handoffs between speakers.

---

## Risk 6 — We are accused of overclaiming

**The risk:** we say "immune system" and a jury member hears "it invents new defences", then
finds out it is a lookup table, and stops trusting everything else we said.

**What we do about it:** say what it actually does, out loud, before anyone asks. It selects
from six known layers using a fixed mapping, plus one layer that genuinely learns. That is
the claim, it is true, and it is still good.

**General rule:** every claim in this project should be one we would be comfortable being
cross-examined on. If it is not, soften it before the jury does.

---

## Risk 7 — Three people, one codebase

**What we do about it:** agree the file formats at M0, one file per test case, clear
ownership of directories, daily fifteen-minute check-in, small pull requests.

---

## Open questions to settle early

1. **Which hosted model for Orin?** Affects cost and results. Decide at M0 and record it in
   config.

2. **Is emailing an external auditor allowed or not?** Benign task B2-019 depends on the
   answer. Whatever we pick, the policy must be stated in Orin's system prompt so the
   correct behaviour is unambiguous.

3. **How do we count a partial completion of a benign task?** If Orin does half the job, is
   that completed? Proposal: no. Binary. But it must be written down before we score
   anything.

4. **Does the mutator get to see the defence config?** Proposal: no. It attacks blind, like
   a real attacker. Worth revisiting if the loop converges too fast.

5. **Do we test more than one model?** Costs more, makes the finding much stronger. Decide
   after we see M4 results and know the budget.

6. **Who does the outsider review of the benign suite?** Needs to be someone not on the team.
   Ask early — this is a real dependency on somebody else's time.

7. **What exactly is the canary?** A fixed string is easy to check but easy to strip. A
   per-run random string is stronger. Proposal: per-run random, recorded in the result row.

---

## The four things we never cut

1. The benign suite, including the outsider review
2. The oracles and their tests
3. The baseline run with no defences
4. The honest limitations section

Everything else is negotiable. These four are the project.
