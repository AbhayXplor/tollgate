# 04, Demo Changes

The five-act structure from `tollgate-docs/11` survives. Three beats change and one
beat is added. **Acts 2 and 4 are still untouchable**, they are the presentation.

---

## The running order (v2)

### Act 1, It happened to the best in the world (45s)  *CHANGED*

Open on the Fable 5 screenshot: a GitHub issue titled "safety classifier
false-positives on authorized defensive security audits", and the Anthropic statement
admitting the stricter classifier flags benign requests.

> "In June, the best AI lab on earth shipped a safety fix that flagged security
> audits as attacks. Their engineers aren't careless, the check that should have
> caught it does not exist. Anywhere. We built it."

Then 10 seconds of Orin doing its job, so the room knows what we are protecting.

### Act 2, The blank page (60s)  *UNCHANGED*

The printer ticket. Full screen. "Read it, there is nothing else there."
Run it. The exfil server prints the salary row live. Then the hexdump reveal: 180
invisible Unicode tag characters.

> "Human oversight is not a control if the attack is invisible to humans."

Then the free credibility point: *"Microsoft documented phishing campaigns using this
exact technique six days ago."*

### Act 3, We patch it, and the gate speaks (75s)  *CHANGED, new beat inside*

Same as before: patch on, same ticket, blocked, exfil server silent. ASR drops.

Then the new beat. The gate runs the honest suite against the paranoid patch:

```
PATCH ACCEPTED?   ✗  REJECTED
  attack success:  61% → 6%      ✓ passes G1
  honest work:     94% → 61%     ✗ fails G2 (Toll 33 > 10)
  ordinary work:   94% → 86%     ✗ fails G3 (floor 90)
→ reverted. Loop retries with a tuned threshold...
PATCH ACCEPTED?   ✓
  attack success:  61% → 14%     ✓
  honest work:     94% → 89%     ✓ Toll = 5
```

> "The loop proposed the paranoid fix. The gate refused it, it costs a third of the
> helpdesk. It retried, found the setting that keeps the block rate and keeps the
> job. That decision is what everyone else skips."

Pre-computed runs, replayed live from `loop.jsonl`. Nothing calls an API on stage.

### Act 4, The chart and the bill (75s)  *CHANGED, buyer moment added*

The frontier chart with every config plotted, TCR-ordinary vs TCR-lookalike split
shown for the recommended setting. The lookalike collapse is the quotable result.

Then the buyer moment:

> "You're the platform lead. The vendor says 94% block rate and quotes no other
> number. Here is your chart, every setting, what it blocks, and what it costs in
> your real work. Pick your point. We just turned a marketing number into a
> procurement decision."

And the dollarization line: at lookalike-shaped volume ≈ a third of real helpdesk
traffic, the rejected patch bounces X tickets a day back to humans. One number, in
money. *(Compute from our own corpus share, state it as our claim, from our design.)*

### Act 5, Do not trust the scoreboard (30s)  *UNCHANGED*

The AI judge's perfect 0% ASR report, cut against the tool log showing the salary
leaving at step four.

> "That report was written by an AI judge reading attacker-controlled text. So we
> attacked it, and it passed us during a live breach. Every number in this project
> comes from tool logs, not opinions.
>
> Do not trust the scoreboard. Instrument the tools."

### Closing  *UPDATED*

> "Everyone here will show you a guardrail. We showed you the gate that decides
> whether it ships. When agents build agents, that gate is the job."

---

## What did not change

- Everything pre-computed; wifi-off rehearsal; vendored Chart.js; local exfil server;
  backup video on disk (`tollgate-docs/11` checklist applies as written).
- Never cut Acts 2 and 4.
- One small live attack in reserve for jury questions.

## New Q&A answers to rehearse

**"So it just tunes a threshold?"**
No, the threshold is one knob on one layer. The gate works on any config patch:
allow-lists, learned-bank entries, prompt hardening. The mechanism is the pricing
and the revert, not the knob.

**"Why won't GPT-6 Astra just do this itself?"**
Three answers: self-grading (the A6 twist, same-model verification reads
attacker-controlled text), the artifact (the corpus and oracles are data and method,
not capability, Fable 5 proves capability isn't the bottleneck), and drift (Astra
shipped six days ago; the next bump silently re-rolls every guardrail decision —
re-verification is a standing loop, not a one-shot prompt).

**"Isn't the gate just your arbitrary threshold?"**
The defaults are stated, and the pilot sweep tunes them, but the gate's output isn't
"good/bad", it's the full curve. Ship wherever you like; we show the price of every
seat on the boat. The gate exists so the *loop* can't lie to itself.

**"AgentDojo already measures utility vs security."**
Yes, on generic benchmark tasks, it tells you the tradeoff exists. We tell you
*where the cost comes from* (lookalike-shaped work), *on your workload*, and we add
the piece no benchmark has: the ship/no-ship gate with revert semantics.
