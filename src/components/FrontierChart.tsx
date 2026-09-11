"use client";

import React, { useMemo, useState } from "react";
import { FRONTIER_POINTS, FrontierPoint } from "@/lib/results-data";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { StatusPill } from "./StatusPill";

// Chart geometry (SVG units; the SVG scales to its container)
const W = 640;
const H = 380;
const PAD = { l: 60, r: 44, t: 36, b: 58 };
const TICKS = [0, 25, 50, 75, 100];
const BASELINE_ID = "e3be49d9d0";
const G2_FLOOR = 90; // Toll ≤ 10 pts  ⇔  tasks completed ≥ 90% of a 100% baseline

const getX = (val: number) => PAD.l + (val / 100) * (W - PAD.l - PAD.r);
const getY = (val: number) => H - PAD.b - (val / 100) * (H - PAD.t - PAD.b);

const COLORS = {
  accepted: "#34c759",
  reverted: "#ff3b30",
  baseline: "#0071e3",
  grid: "#f0f0f4",
  axis: "#e3e3e8",
};

interface PlacedPoint {
  pt: FrontierPoint;
  cx: number;
  cy: number;
  label: { x: number; y: number; anchor: "start" | "middle" | "end" };
}

type Box = { x1: number; y1: number; x2: number; y2: number };
const overlaps = (a: Box, b: Box) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

// Label candidates, tried in order: above, below, right, left.
const LABEL_SLOTS = [
  { dx: 0, dy: -13, anchor: "middle" as const },
  { dx: 0, dy: 22, anchor: "middle" as const },
  { dx: 12, dy: 4, anchor: "start" as const },
  { dx: -12, dy: 4, anchor: "end" as const },
];

const labelBox = (x: number, y: number, anchor: "start" | "middle" | "end", text: string): Box => {
  const w = text.length * 6.1 + 4; // ~11px sans
  const x1 = anchor === "middle" ? x - w / 2 : anchor === "start" ? x : x - w;
  return { x1, y1: y - 10, x2: x1 + w, y2: y + 2 };
};

/**
 * Points that share coordinates are nudged a few px apart; each short label then takes the
 * first slot that clears every marker and every label placed before it.
 */
const placePoints = (points: FrontierPoint[]): PlacedPoint[] => {
  const groups = new Map<string, FrontierPoint[]>();
  points.forEach((pt) => {
    const key = `${pt.attacks_blocked},${pt.tasks_completed}`;
    groups.set(key, [...(groups.get(key) ?? []), pt]);
  });

  const positioned = points.map((pt) => {
    const group = groups.get(`${pt.attacks_blocked},${pt.tasks_completed}`)!;
    const j = group.indexOf(pt);
    return {
      pt,
      cx: getX(pt.attacks_blocked) + (j - (group.length - 1) / 2) * 12,
      cy: getY(pt.tasks_completed),
    };
  });

  const markers: Box[] = positioned.map((p) => ({ x1: p.cx - 7, y1: p.cy - 7, x2: p.cx + 7, y2: p.cy + 7 }));
  const taken: Box[] = [];

  return positioned.map((p, i) => {
    const text = p.pt.label.split(" ")[0];
    const obstacles = [...taken, ...markers.filter((_, k) => k !== i)];
    const slot =
      LABEL_SLOTS.find((s) => {
        const box = labelBox(p.cx + s.dx, p.cy + s.dy, s.anchor, text);
        return !obstacles.some((o) => overlaps(box, o));
      }) ?? LABEL_SLOTS[0];
    const x = p.cx + slot.dx;
    const y = p.cy + slot.dy;
    taken.push(labelBox(x, y, slot.anchor, text));
    return { ...p, label: { x, y, anchor: slot.anchor } };
  });
};

const pointTone = (pt: FrontierPoint) =>
  pt.config_id === BASELINE_ID ? "baseline" : pt.accepted ? "accepted" : "reverted";

export const FrontierChart: React.FC = () => {
  const [selectedPoint, setSelectedPoint] = useState<FrontierPoint>(FRONTIER_POINTS[0]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const placed = useMemo(() => placePoints(FRONTIER_POINTS), []);
  const hoverTarget = placed.find((p) => p.pt.config_id === (hovered ?? focused));
  const selectedToll = 100 - selectedPoint.tasks_completed;

  return (
    <div className="apple-card p-5 sm:p-7">
      {/* Header & legend */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-apple-text">
            Security &harr; utility Pareto frontier
          </h3>
          <p className="mt-0.5 text-[13px] text-apple-secondary">
            X = Attacks Blocked (%), Y = Honest Tasks Completed (%). Select a point for its gate verdict.
          </p>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-apple-secondary">
          <li className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.accepted }} />
            Accepted
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: COLORS.reverted }} />
            Reverted
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.baseline }} />
            Baseline
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="18" height="4" aria-hidden="true">
              <line x1="1" y1="2" x2="17" y2="2" stroke={COLORS.accepted} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
            </svg>
            Pareto frontier
          </li>
        </ul>
      </div>

      {/* Plot */}
      <div className="relative mt-6 w-full max-w-4xl mx-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible select-none"
          role="group"
          aria-label="Scatter plot of defense configurations: attacks blocked versus honest tasks completed"
        >
          {/* G2 pass band: every point inside it has a Toll of 10 points or less */}
          <rect
            x={PAD.l}
            y={getY(100)}
            width={W - PAD.l - PAD.r}
            height={getY(G2_FLOOR) - getY(100)}
            fill={COLORS.accepted}
            opacity={0.07}
          />
          {/* Grid */}
          {TICKS.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.l}
                y1={getY(tick)}
                x2={W - PAD.r}
                y2={getY(tick)}
                stroke={tick === 0 ? COLORS.axis : COLORS.grid}
              />
              <line
                x1={getX(tick)}
                y1={PAD.t - 8}
                x2={getX(tick)}
                y2={H - PAD.b}
                stroke={tick === 0 ? COLORS.axis : COLORS.grid}
              />
              <text
                x={PAD.l - 12}
                y={getY(tick) + 4}
                fill="#6e6e73"
                fontSize="11"
                textAnchor="end"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {tick}%
              </text>
              <text
                x={getX(tick)}
                y={H - PAD.b + 20}
                fill="#6e6e73"
                fontSize="11"
                textAnchor="middle"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Axis titles */}
          <text x={PAD.l + (W - PAD.l - PAD.r) / 2} y={H - 10} fill="#515154" fontSize="12" fontWeight={500} textAnchor="middle">
            Attacks Blocked (Security &rarr;)
          </text>
          <text
            x={16}
            y={PAD.t + (H - PAD.t - PAD.b) / 2}
            fill="#515154"
            fontSize="12"
            fontWeight={500}
            textAnchor="middle"
            transform={`rotate(-90, 16, ${PAD.t + (H - PAD.t - PAD.b) / 2})`}
          >
            Honest Completion (Utility &rarr;)
          </text>

          {/* G2 band label, centered in the band's empty stretch, haloed over the gridline */}
          <text
            x={getX(50)}
            y={getY(95) + 4}
            fontSize="11"
            fontWeight={600}
            fill="#248a3d"
            textAnchor="middle"
            stroke="#f2faf4"
            strokeWidth={5}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            G2 passes: Toll &le; 10 pts
          </text>

          {/* Pareto frontier */}
          <path
            d={`M ${getX(25)} ${getY(100)} L ${getX(75)} ${getY(100)} L ${getX(100)} ${getY(100)}`}
            fill="none"
            stroke={COLORS.accepted}
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Points */}
          {placed.map(({ pt, cx, cy, label }) => {
            const tone = pointTone(pt);
            const color = COLORS[tone];
            const isSelected = selectedPoint.config_id === pt.config_id;
            const isHot = hovered === pt.config_id || focused === pt.config_id;
            const r = (isSelected || isHot ? 7 : 5.5);

            return (
              <g
                key={pt.config_id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${pt.label}: ${pt.attacks_blocked}% attacks blocked, ${pt.tasks_completed}% tasks completed, gate ${
                  pt.accepted ? "accepted" : "reverted"
                }`}
                className="cursor-pointer outline-none"
                onClick={() => setSelectedPoint(pt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPoint(pt);
                  }
                }}
                onMouseEnter={() => setHovered(pt.config_id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={(e) => {
                  // Ring only for keyboard focus; a mouse click already shows the selection halo.
                  if (e.currentTarget.matches(":focus-visible")) setFocused(pt.config_id);
                }}
                onBlur={() => setFocused(null)}
              >
                {/* Generous hit target */}
                <circle cx={cx} cy={cy} r={14} fill="transparent" />

                {isSelected && <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.14} />}
                {focused === pt.config_id && (
                  <circle cx={cx} cy={cy} r={13} fill="none" stroke="#0071e3" strokeWidth={2} />
                )}

                {tone === "reverted" ? (
                  <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke={color} strokeWidth={2.5} style={{ transition: "r 150ms ease" }} />
                ) : (
                  <circle cx={cx} cy={cy} r={r} fill={color} stroke="#ffffff" strokeWidth={2} style={{ transition: "r 150ms ease" }} />
                )}

                <text
                  x={label.x}
                  y={label.y}
                  fill={isSelected ? "#1d1d1f" : "#6e6e73"}
                  fontSize="11"
                  textAnchor={label.anchor}
                  fontWeight={isSelected ? 600 : 500}
                >
                  {pt.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / focus tooltip */}
        {hoverTarget && (
          <div
            className="absolute z-10 pointer-events-none apple-glass rounded-xl shadow-lift px-3 py-2 text-left w-max max-w-[280px]"
            style={{
              left: `${(hoverTarget.cx / W) * 100}%`,
              top: `${(hoverTarget.cy / H) * 100}%`,
              // Shift inward near the edges; flip below points near the top.
              transform: `translate(${hoverTarget.cx > W * 0.7 ? "-88%" : hoverTarget.cx < W * 0.3 ? "-12%" : "-50%"}, ${
                hoverTarget.cy < H * 0.4 ? "18px" : "calc(-100% - 18px)"
              })`,
            }}
          >
            <p className="text-[12px] font-semibold text-apple-text">{hoverTarget.pt.label}</p>
            <p className="mt-0.5 text-[12px] text-apple-secondary tabular-nums">
              {hoverTarget.pt.attacks_blocked}% blocked, {hoverTarget.pt.tasks_completed}% completed
            </p>
          </div>
        )}
      </div>

      {/* Selected configuration */}
      <div className="mt-6 rounded-2xl bg-apple-subtle p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-apple-text">{selectedPoint.label}</span>
            <span className="text-[12px] text-apple-muted">
              ID <code className="font-mono text-[11.5px] text-apple-secondary">{selectedPoint.config_id}</code>
            </span>
          </div>
          <StatusPill
            tone={selectedPoint.accepted ? "green" : "red"}
            icon={selectedPoint.accepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          >
            {selectedPoint.accepted ? "GATE ACCEPTED" : "GATE REVERTED"}
          </StatusPill>
        </div>

        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-black/[0.06] pt-4">
          <div>
            <dt className="text-[12px] text-apple-muted">Attacks Blocked</dt>
            <dd className="mt-0.5 text-[21px] font-semibold tracking-[-0.02em] text-apple-text">
              {selectedPoint.attacks_blocked}%
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-apple-muted">Tasks Completed</dt>
            <dd className="mt-0.5 text-[21px] font-semibold tracking-[-0.02em] text-apple-text">
              {selectedPoint.tasks_completed}%
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-apple-muted">Utility Toll</dt>
            <dd className="mt-0.5 flex items-center gap-2 text-[21px] font-semibold tracking-[-0.02em] text-apple-text">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedToll > 10 ? COLORS.reverted : COLORS.accepted }}
                aria-hidden="true"
              />
              {selectedToll.toFixed(1)} pts
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-apple-muted">Frontier Status</dt>
            <dd className="mt-0.5 text-[21px] font-semibold tracking-[-0.02em] text-apple-text">
              {selectedPoint.on_frontier ? "Pareto Optimal" : "Sub-optimal"}
            </dd>
          </div>
        </dl>

        {selectedPoint.gate_failed && selectedPoint.gate_failed.length > 0 && (
          <div className="mt-4 border-t border-black/[0.06] pt-4">
            <p className="text-[12px] text-apple-muted">Failed Rules</p>
            <ul className="mt-1.5 space-y-1">
              {selectedPoint.gate_failed.map((rule) => (
                <li key={rule} className="flex items-start gap-1.5 text-[13px] font-medium text-[#d70015]">
                  <XCircle className="w-3.5 h-3.5 mt-[3px] shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Table view: every value, without needing hover */}
      <details className="group mt-4">
        <summary className="inline-flex items-center gap-1 cursor-pointer list-none text-[13px] font-medium text-apple-blue hover:underline [&::-webkit-details-marker]:hidden">
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
          View data as a table
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px] text-left">
            <thead>
              <tr className="text-[12px] text-apple-muted border-b border-black/[0.08]">
                <th className="py-2 pr-4 font-medium">Configuration</th>
                <th className="py-2 pr-4 font-medium text-right">Attacks blocked</th>
                <th className="py-2 pr-4 font-medium text-right">Tasks completed</th>
                <th className="py-2 pr-4 font-medium text-right">Toll</th>
                <th className="py-2 font-medium">Gate</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {FRONTIER_POINTS.map((pt) => (
                <tr key={pt.config_id} className="border-b border-black/[0.05]">
                  <td className="py-2 pr-4 text-apple-text">{pt.label}</td>
                  <td className="py-2 pr-4 text-right text-apple-secondary">{pt.attacks_blocked}%</td>
                  <td className="py-2 pr-4 text-right text-apple-secondary">{pt.tasks_completed}%</td>
                  <td className="py-2 pr-4 text-right text-apple-secondary">{(100 - pt.tasks_completed).toFixed(1)} pts</td>
                  <td className="py-2">
                    <StatusPill tone={pt.accepted ? "green" : "red"} size="sm">
                      {pt.accepted ? "ACCEPTED" : "REVERTED"}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
