# Tollgate live demo site

The interactive demo for Tollgate, built by team ÆRYX: a 3D view of the
break → diagnose → patch → price → gate → ship/revert loop, the Orin helpdesk
simulator with live defense toggles, the War Room loop, and the security ↔ utility
frontier.

Everything runs in the browser. The helpdesk agent, its tools, the defenses and the
War Room rounds are simulated in `src/lib/orin-engine.ts` and `src/components/TheaterFeed.tsx`,
and the frontier numbers live in `src/lib/results-data.ts`. The site needs no API key and
calls no backend.

## Run it

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Guided tour

First-time visitors get a short spotlight tour (`src/components/GuidedTour.tsx`).
It can be replayed from **Tour** in the top bar or by opening `/?tour=1`.
Tour stops point at elements tagged with a `data-tour="…"` attribute; the steps
themselves are defined in `src/app/page.tsx`.

## Stack

Next.js 14 (App Router), React 18, Tailwind CSS, three.js.
