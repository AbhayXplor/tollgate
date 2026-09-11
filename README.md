# Tollgate: live demo

**Live:** https://tollgate-aeryx.vercel.app

Tollgate is the release gate for AI agent security: it breaks an agent, diagnoses what
broke, patches it, prices what the patch costs honest users, and ships the patch only if
it passes four mechanical rules. This repo is the interactive demo site, built by
team **ÆRYX** for the School of Cyber Defense hackathon.

The Tollgate engine itself lives in [AbhayXplor/tollgate](https://github.com/AbhayXplor/tollgate);
the same site is on its `feat/web-demo` branch under `web/`.

## What's on the site

- **The loop:** a 3D view of BREAK → DIAGNOSE → PATCH → PRICE → GATE → SHIP/REVERT.
- **The Toll:** `The Toll = TCR(baseline) − TCR(candidate)`, the points of honest work a
  patch destroys, with a meter showing the 10-point auto-revert limit.
- **Gate rules G1–G4:** real attack reduction, Toll ≤ 10 points, ordinary tasks kept,
  zero new false alarms.
- **Orin Helpdesk:** chat with a simulated IT agent, run attack and honest scenarios, and
  switch defenses on and off while the Toll updates live.
- **War Room:** watch rounds of attack, patch, price and gate, or inject your own attack.
- **Frontier:** every defense configuration plotted as security vs honest work.
- **Guided tour:** opens on the first visit; replay it from **Tour** in the top bar or `/?tour=1`.

Everything runs in the browser. The agent, its tools, the defenses and the War Room rounds
are simulated in `src/lib/orin-engine.ts` and `src/components/TheaterFeed.tsx`; the frontier
numbers are in `src/lib/results-data.ts`. **No API key or backend is needed.**

## Versions

Each version is a tagged commit, so you can browse or check out any of them:

| Tag | What it is |
|---|---|
| `v0-original` | The original site as handed over: dark cyberpunk theme with neon glows, scanlines and monospace headings. |
| `v1-apple-redesign` | Apple-style light redesign of every screen, plus fixes (hydration mismatch, War Room Stop, page-jumping log). Design brief: [`docs/redesign-brief.md`](docs/redesign-brief.md). |
| `v2-guided-tour` | Adds the spotlight tour for first-time visitors and credits team ÆRYX. |

```bash
git checkout v0-original   # or v1-apple-redesign, v2-guided-tour
```

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploying

The Vercel project `tollgate-aeryx` is connected to this repo: every push to `main`
deploys to production, and other branches get preview URLs. `vercel.json` pins the
framework to Next.js.

## Stack

Next.js 14 (App Router), React 18, Tailwind CSS, three.js.
