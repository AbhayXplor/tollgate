"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { StatusPill } from "./StatusPill";

interface TollMeterProps {
  toll: number; // 0 to 100
  title?: string;
  subtitle?: string;
  showDetails?: boolean;
}

const STATES = {
  safe: {
    stroke: "#34c759",
    track: "rgba(52, 199, 89, 0.14)",
    text: "#248a3d",
    tone: "green" as const,
    label: "GATE PASSES",
    Icon: CheckCircle2,
  },
  warning: {
    stroke: "#ff9500",
    track: "rgba(255, 149, 0, 0.14)",
    text: "#b25e00",
    tone: "amber" as const,
    label: "HIGH TOLL",
    Icon: AlertTriangle,
  },
  critical: {
    stroke: "#ff3b30",
    track: "rgba(255, 59, 48, 0.12)",
    text: "#d70015",
    tone: "red" as const,
    label: "AUTO-REVERT",
    Icon: XCircle,
  },
};

// Ring geometry: a 270° arc opening at the bottom, like an Apple Watch gauge.
const CX = 110;
const CY = 104;
const R = 80;
const STROKE = 13;
const START_DEG = 135;
const SWEEP_DEG = 270;
const CIRC = 2 * Math.PI * R;
const ARC = CIRC * (SWEEP_DEG / 360);
const GATE_LIMIT = 10;

const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

export const TollMeter: React.FC<TollMeterProps> = ({
  toll,
  title = "The Toll meter",
  subtitle = "Points of honest utility lost to safety guardrails",
  showDetails = true,
}) => {
  const clampedToll = Math.min(100, Math.max(0, toll));

  const isSafe = clampedToll <= 10.0;
  const isWarning = clampedToll > 10.0 && clampedToll <= 30.0;
  const isCritical = clampedToll > 30.0;
  const state = isSafe ? STATES.safe : isWarning ? STATES.warning : STATES.critical;

  const fraction = clampedToll / 100;
  const dashOffset = ARC * (1 - fraction);

  const tickDeg = START_DEG + SWEEP_DEG * (GATE_LIMIT / 100);
  const tickIn = polar(tickDeg, R - STROKE / 2 - 3);
  const tickOut = polar(tickDeg, R + STROKE / 2 + 3);
  const tickLabel = polar(tickDeg, R + STROKE / 2 + 9);
  const zeroLabel = polar(START_DEG, R);
  const maxLabel = polar(START_DEG + SWEEP_DEG, R);

  return (
    <div className="apple-card p-6 flex flex-col items-center text-center">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-apple-text">{title}</h3>
      <p className="mt-0.5 text-[13px] text-apple-secondary">{subtitle}</p>

      <div className="relative mt-4 w-full max-w-[250px]">
        <svg viewBox="0 0 220 196" className="w-full h-auto overflow-visible" role="img" aria-label={`Toll ${clampedToll.toFixed(1)} points out of 100; gate limit 10 points`}>
          {/* Track: a tint of the current state, Fitness-ring style */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={state.track}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${CIRC}`}
            transform={`rotate(${START_DEG} ${CX} ${CY})`}
            style={{ transition: "stroke 500ms ease" }}
          />

          {/* Value */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={state.stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${CIRC}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(${START_DEG} ${CX} ${CY})`}
            opacity={fraction > 0 ? 1 : 0}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1), stroke 500ms ease" }}
          />

          {/* 10-point auto-revert threshold */}
          <line
            x1={tickIn.x}
            y1={tickIn.y}
            x2={tickOut.x}
            y2={tickOut.y}
            stroke="#1d1d1f"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <text
            x={tickLabel.x}
            y={tickLabel.y + 3}
            textAnchor="end"
            fontSize="10"
            fontWeight={600}
            fill="#1d1d1f"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            10
          </text>

          <text x={zeroLabel.x} y={zeroLabel.y + 24} textAnchor="middle" fontSize="10" fill="#6e6e73">
            0
          </text>
          <text x={maxLabel.x} y={maxLabel.y + 24} textAnchor="middle" fontSize="10" fill="#6e6e73">
            100
          </text>
        </svg>

        {/* Center value */}
        <div className="absolute inset-x-0 top-[34%] flex flex-col items-center pointer-events-none">
          <span className="text-[44px] leading-none font-semibold tracking-[-0.03em] text-apple-text tabular-nums">
            {clampedToll.toFixed(1)}
          </span>
          <span className="mt-1.5 text-[13px] text-apple-muted">points lost</span>
        </div>
      </div>

      {/* Threshold and verdict */}
      <div className="mt-2 w-full flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <span className="text-[13px] text-apple-secondary tabular-nums">Gate limit: &le; 10.0 pts</span>
        <StatusPill tone={state.tone} icon={<state.Icon className="w-3.5 h-3.5" />}>
          {state.label}
        </StatusPill>
      </div>

      {showDetails && (
        <dl className="mt-4 w-full rounded-xl bg-apple-subtle px-4 py-3 text-[13px] text-left space-y-2">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-apple-secondary">Honest Completion (TCR)</dt>
            <dd className="font-semibold text-apple-text tabular-nums">{(100 - clampedToll).toFixed(1)}%</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-apple-secondary shrink-0">Fable Dilemma</dt>
            <dd
              className="font-medium text-right"
              style={{ color: isCritical ? STATES.critical.text : STATES.safe.text }}
            >
              {isCritical ? "Model lobotomized on benign requests" : "Honest work preserved"}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
};
