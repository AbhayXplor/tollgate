# Tollgate Web UI Handover & Design System Specification

> **Target Codebase**: `c:\Users\aadit\Downloads\tollgate\web`  
> **Framework**: Next.js 14 (App Router) + React 18 + Tailwind CSS + Three.js  
> **Original Theme**: Cyberpunk dark mode (`#070b14` background, neon cyan/emerald/ruby glows, CRT scanlines, all-caps JetBrains Mono monospace headings)  
> **Target Theme**: Apple-inspired minimalist light theme (clean, luminous, restrained, SF/Inter typography, refined 3D kinetic sculpture)  

---

## 1. Executive Summary & Design Vision

The user requested a complete UI overhaul for the Tollgate live demo website to make it:
1. **Cleaner and less "AI-coded"**: Eliminate generic hacker/cyberpunk tropes (pure black backgrounds, harsh neon glows, CRT scanline overlays, and all-caps monospace typography on headings, badges, and buttons).
2. **Minimalist Light Theme**: Inspired by Apple’s product and developer design language (`#fbfbfd` luminous background, `#ffffff` card surfaces, subtle 1px borders `rgba(0, 0, 0, 0.08)`, soft drop shadows, and clean frosted glass `backdrop-blur-xl`).
3. **100% Content & Functional Preservation**:
   - The Tollgate formula: `The Toll = TCR(baseline) − TCR(candidate)`.
   - The 6 pipeline stages: `BREAK`, `DIAGNOSE`, `PATCH`, `PRICE`, `GATE`, `SHIP/REVERT`.
   - The 4 Gate Rules: G1 (ΔASR ≥ 10%), G2 (Toll ≤ 10 pts), G3 (B1 TCR ≥ 95%), G4 (0 new False Alarms).
   - The interactive Orin Helpdesk chat simulator with real-time tool execution traces and scenario presets.
   - The interactive Defense Matrix toggles and live Toll calculation.
   - The War Room Theater adversarial loop with round selector, mode selector, and manual attack injection.
   - The Security ↔ Utility Pareto Frontier scatter plot and side-by-side config comparison cards.
   - Standalone routes `/orin` and `/warroom`.

---

## 2. Copy-Pasteable System Prompt for the Next Agent

```markdown
You are an elite, world-class front-end engineer and website designer specializing in Apple-grade UI/UX design.

Your task is to redesign the Tollgate 3JS live demo website located at `c:\Users\aadit\Downloads\tollgate\web`.

### Design Mandate:
- Transform the website from its current dark cyberpunk aesthetic into a clean, minimalist, Apple-inspired light theme.
- Avoid generic AI-generated aesthetics (no harsh purple/cyan neon gradients, no CRT scanline overlays, no monospace headings).
- Use Apple's design language:
  - Page Background: `#fbfbfd`
  - Cards: Pure `#ffffff` with subtle borders (`rgba(0, 0, 0, 0.08)`) and soft elevation (`box-shadow: 0 2px 12px rgba(0, 0, 0, 0.035)`)
  - Primary Typography: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif`
  - Code/Terminal Tokens: Monospace (`"SF Mono", Menlo, Consolas, monospace`) strictly for actual CLI commands (`tollgate demo --mock`), code snippets, and tool parameters.
  - Accent Tints: Apple Blue (`#0071e3`), Apple Emerald (`#34c759` / `#248a3d`), Apple Coral Red (`#ff3b30` / `#d70015`), Apple Amber (`#ff9500` / `#b25e00`).

### Critical Invariants:
1. Preserve 100% of the text, narrative, formulas, rules (G1, G2, G3, G4), data points, benchmarks, and interactive logic.
2. Keep the 3D Three.js animation running, but adapt it for the light background with studio lighting (ambient + key lights), polished ceramic/glass spheres, smooth translucent orbital conduit, and high-legibility particles (NormalBlending, not AdditiveBlending).
3. Fix the Next.js hydration error on `ChatPanel.tsx` by initializing `new Date().toLocaleTimeString()` inside a client-side `useEffect`.
4. Ensure `npm run build` passes with zero errors.
```

---

## 3. Skills & Design Intelligence

When executing this task, activate and follow the guidelines from:
- **`frontend-design`** (`C:\Users\aadit\.gemini\config\skills\frontend-design\SKILL.md`):
  - Commit to a clear, cohesive aesthetic (refined minimalism).
  - High-impact visual moments (clean 3D sculpture, silky segmented pill switcher).
  - Spatial composition with generous negative space and tight typography letter-spacing.
- **`web-design-guidelines`** (`C:\Users\aadit\.gemini\config\skills\web-design-guidelines\SKILL.md`):
  - Accessible color contrast for all text elements.
  - Interactive element states (hover, active, disabled, focus-visible).
  - Clean DOM hierarchy with proper semantic tags.

---

## 4. Design System Tokens (`tailwind.config.ts` & `globals.css`)

### Color Tokens
```typescript
colors: {
  apple: {
    bg: "#fbfbfd",
    surface: "#ffffff",
    subtle: "#f5f5f7",
    border: "rgba(0, 0, 0, 0.08)",
    borderHover: "rgba(0, 0, 0, 0.16)",
    text: "#1d1d1f",
    secondary: "#515154",
    muted: "#86868b",
    blue: "#0071e3",
    blueHover: "#0077ed",
    blueSubtle: "rgba(0, 113, 227, 0.08)",
    green: "#34c759",
    greenDark: "#248a3d",
    greenSubtle: "rgba(52, 199, 89, 0.12)",
    red: "#ff3b30",
    redDark: "#d70015",
    redSubtle: "rgba(255, 59, 48, 0.08)",
    amber: "#ff9500",
    amberDark: "#b25e00",
    amberSubtle: "rgba(255, 149, 0, 0.1)",
  }
}
```

### Typography Hierarchy
- **Font Stack**:
  - `font-sans`: `['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Inter"', 'system-ui', 'sans-serif']`
  - `font-mono`: `['"SF Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace']`
- **Headings**: Semibold (600) / Bold (700) with `tracking-tight`. No uppercase monospace for general headings.
- **Body**: Regular (400) / Medium (500) `#515154` with generous line-height (`leading-relaxed`).

### Card & Glass Utilities (`globals.css`)
```css
:root {
  color-scheme: light;
}

body {
  background-color: #fbfbfd;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Apple Frosted Glass */
.apple-glass {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.07);
}

/* Apple Card Panels */
.cyber-panel {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.035), 0 1px 2px rgba(0, 0, 0, 0.02);
  border-radius: 1rem;
}
```

---

## 5. Detailed Component Specifications

### 1. `Navbar.tsx`
- **Container**: `sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-xl`.
- **Brand Lockup**: Apple Blue rounded squircle with shield icon, "Tollgate" in bold sans-serif, and a sleek "Release Gate" badge.
- **Nav Links**: Apple segmented control pill (`p-1 rounded-full bg-black/[0.04]`) with active white pill state.
- **Status & GitHub**: Clean pill badge with green status dot and white GitHub button.

### 2. `HeroScene.tsx` (Three.js 3D Kinetic Sculpture)
- **Background**: Transparent canvas inside a subtle gradient container (`from-[#fbfbfd] via-white to-[#f5f5f7] border border-black/[0.06] rounded-3xl`).
- **Lighting**:
  - `AmbientLight(0xffffff, 1.4)`
  - `DirectionalLight(0xffffff, 1.6)` at `(8, 16, 12)`
  - `DirectionalLight(0x0071e3, 0.4)` rim light at `(-10, -6, -8)`
  - `HemisphereLight(0xffffff, 0xe5e7eb, 0.6)`
- **6 Pipeline Nodes**:
  - Spheres: `MeshStandardMaterial` (`roughness: 0.15, metalness: 0.1`) with stage colors:
    - BREAK: Coral Crimson (`0xff3b30`)
    - DIAGNOSE: Sky Blue (`0x0284c7`)
    - PATCH: Indigo (`0x5856d6`)
    - PRICE: Amber (`0xff9500`)
    - GATE: Apple Emerald (`0x34c759`)
    - SHIP/REVERT: Violet (`0xaf52de`)
  - Halos: `RingGeometry` with subtle opacity (0.25).
- **Orbital Conduit**: Spline tube with `color: 0xd1d5db, roughness: 0.3, transparent: true, opacity: 0.85`.
- **Flowing Data Particles**: `PointsMaterial` with `NormalBlending` (NOT `AdditiveBlending`, which disappears on white!), size 0.16, alternating Apple Blue and Emerald.
- **HUD Overlays**: Apple glass pills (`apple-glass p-3.5 rounded-2xl shadow-sm`) showing the active stage name and description.

### 3. `TollMeter.tsx` (Circular Gauge)
- **Design**: Apple Watch / Fitness activity ring style.
- **Track**: Light grey arc (`stroke="#f0f0f4"`, `strokeWidth="13"`).
- **Active Stroke**: Smooth transition between Green (`#34c759` for ≤10 pts), Amber (`#ff9500` for 10-30 pts), and Red (`#ff3b30` for >30 pts).
- **10% Threshold Tick**: Distinct marker on the track indicating the auto-revert limit.
- **Center Value**: Bold 4xl number (`#1d1d1f`) with "points lost" label.
- **Verdict Indicator**: Apple pill badge:
  - `GATE PASSES` (Emerald `#248a3d` on `#34c759`/10)
  - `HIGH TOLL` (Amber `#b25e00` on `#ff9500`/10)
  - `AUTO-REVERT` (Red `#d70015` on `#ff3b30`/10)

### 4. `ChatPanel.tsx` (Helpdesk Simulator & Defense Matrix)
- **Hydration Fix**: Initialize `m.timestamp = "Ready"` on initial state, and set actual `toLocaleTimeString()` inside `useEffect(() => { ... }, [])`.
- **Chat Bubbles**:
  - User: Apple Blue (`bg-[#0071e3] text-white rounded-2xl rounded-br-sm`).
  - Assistant (Orin): Clean card (`bg-[#f5f5f7] text-[#1d1d1f] rounded-2xl rounded-bl-sm`).
  - Guard: Alert card (`bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#d70015]`).
  - Tool Calls: Xcode / Inspector-style collapsible trace (`bg-[#f5f5f7] border border-black/[0.06] font-mono text-[11px]`).
- **Defense Matrix**:
  - Replace raw checkboxes with iOS toggle switches (`w-10 h-6 rounded-full relative` with sliding white thumb).
  - D2-Aggressive (Fable Mode) turns red when active with a "High Toll" badge.

### 5. `TheaterFeed.tsx` (Observability Mission Control)
- **Summary Metrics**: 4 clean white cards with large colored counters (Breaches Caught, Attacks Blocked, Honest Retention, Accepted/Reverted ratio).
- **Feed**: Clean timeline list (no scanlines!). Each event has a semantic badge (`ROUND`, `ATTACK`, `TOOL`, `PATCH`, `ACCEPTED`, `REVERTED`).
- **Manual Attack Bar**: Rounded pill input with dispatch button.

### 6. `FrontierChart.tsx` (Keynote Scatter Plot)
- **Canvas**: Clean white background with delicate gridlines (`#f0f0f4`).
- **Pareto Curve**: Smooth dashed emerald curve (`#34c759`).
- **Points**: Interactive SVG nodes (Accepted in green, Reverted in red ring, Baseline in blue) with hover and selection state updating a clean details card below.

### 7. `ConfigCards.tsx` (Side-by-Side Comparison)
- Two balanced comparison cards:
  - Card 1: Aggressive Patch (Reverted) with red border accent, 3-column stats, and revert rationale.
  - Card 2: Minimal Patch (Accepted) with green border accent, 3-column stats, and accept rationale.

---

## 6. Verification Checklist for the Next Agent

- [ ] Run `npm run build` in `c:\Users\aadit\Downloads\tollgate\web` and verify 0 errors.
- [ ] Verify light theme renders cleanly on `http://localhost:3001/`.
- [ ] Verify 3D kinetic sculpture has studio lighting, visible particles, and smooth parallax.
- [ ] Test Orin Helpdesk scenarios (Honest, Lookalike, Attack) and ensure tool traces render.
- [ ] Test Defense Matrix iOS toggles and confirm TollMeter gauge updates in real time.
- [ ] Test War Room Theater "Start Run" and verify timeline events progress.
- [ ] Verify zero Next.js hydration error badges appear at bottom-left.
