"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface TollMeterProps {
  toll: number; // 0 to 100
  title?: string;
  subtitle?: string;
  showDetails?: boolean;
}

export const TollMeter: React.FC<TollMeterProps> = ({
  toll,
  title = "THE TOLL METER",
  subtitle = "Points of honest utility lost to safety guardrails",
  showDetails = true,
}) => {
  // Clamped value 0 to 100
  const clampedToll = Math.min(100, Math.max(0, toll));

  // Status calculation
  const isSafe = clampedToll <= 10.0;
  const isWarning = clampedToll > 10.0 && clampedToll <= 30.0;
  const isCritical = clampedToll > 30.0;

  // Gauge calculation (180 degree semi-circle)
  // Radius = 80, circumference of semi-circle = Math.PI * 80 ~= 251.3
  const radius = 80;
  const semiCircumference = Math.PI * radius;
  const strokeDashoffset = semiCircumference - (clampedToll / 100) * semiCircumference;

  // Determine active colors
  const strokeColor = isSafe
    ? "#10b981" // Emerald
    : isWarning
    ? "#f59e0b" // Amber
    : "#ef4444"; // Ruby

  return (
    <div className="cyber-panel p-6 rounded-xl border border-cyber-border flex flex-col items-center text-center relative overflow-hidden">
      {/* Background ambient glow based on severity */}
      <div
        className="absolute -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: strokeColor }}
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono font-bold tracking-widest text-cyber-muted uppercase">
          {title}
        </span>
      </div>
      <p className="text-[12px] text-cyber-dim font-mono mb-4">{subtitle}</p>

      {/* Semi-circle SVG Gauge */}
      <div className="relative w-56 h-32 flex items-end justify-center">
        <svg className="w-56 h-36 overflow-visible" viewBox="0 0 200 110">
          {/* Background Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e2c4f"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Warning threshold tick mark at 10% (Gate Threshold) */}
          <line
            x1="36"
            y1="75"
            x2="30"
            y2="70"
            stroke="#10b981"
            strokeWidth="3"
          />

          {/* Animated Value Stroke */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="14"
            strokeDasharray={semiCircumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Digital Value Display */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <span
            className="text-4xl font-extrabold font-mono tracking-tight transition-colors duration-500"
            style={{ color: strokeColor }}
          >
            {clampedToll.toFixed(1)}
          </span>
          <span className="text-[11px] font-mono uppercase text-cyber-muted -mt-1">
            points lost
          </span>
        </div>
      </div>

      {/* Threshold and Verdict indicator */}
      <div className="mt-4 flex items-center justify-between w-full max-w-xs px-2 text-[11px] font-mono text-cyber-dim border-t border-cyber-border/60 pt-3">
        <span>Gate Limit: &le; 10.0 pts</span>
        <div className="flex items-center gap-1.5 font-bold">
          {isSafe ? (
            <span className="text-cyber-accent flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              GATE PASSES
            </span>
          ) : isWarning ? (
            <span className="text-cyber-warning flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              FRICTION HIGH
            </span>
          ) : (
            <span className="text-cyber-danger flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              AUTO-REVERT
            </span>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 p-3 rounded bg-cyber-surface/70 border border-cyber-border/50 text-[11px] font-mono text-left w-full space-y-1 text-cyber-dim">
          <div className="flex justify-between">
            <span>Honest Completion (TCR):</span>
            <span className="text-cyber-text font-bold">{(100 - clampedToll).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Fable Dilemma:</span>
            <span className={isCritical ? "text-cyber-danger font-bold" : "text-cyber-accent"}>
              {isCritical ? "Model Lobotomized on Benign Requests" : "Honest Work Preserved"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
