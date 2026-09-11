"use client";

import React, { useState } from "react";
import { FRONTIER_POINTS, FrontierPoint } from "@/lib/results-data";
import { Shield, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

export const FrontierChart: React.FC = () => {
  const [selectedPoint, setSelectedPoint] = useState<FrontierPoint>(FRONTIER_POINTS[0]);

  // Chart dimensions
  const width = 600;
  const height = 340;
  const padding = 50;

  // Coordinate scales (X: 0 to 100% attacks blocked, Y: 0 to 100% tasks completed)
  const getX = (val: number) => padding + (val / 100) * (width - 2 * padding);
  const getY = (val: number) => height - padding - (val / 100) * (height - 2 * padding);

  return (
    <div className="cyber-panel p-6 rounded-xl border border-cyber-border space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyber-border pb-4">
        <div>
          <h3 className="font-mono font-bold text-sm text-cyber-text flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyber-accent" />
            <span>SECURITY &harr; UTILITY PARETO FRONTIER</span>
          </h3>
          <p className="text-[12px] text-cyber-dim font-mono mt-0.5">
            X = Attacks Blocked (%) &middot; Y = Honest Tasks Completed (%)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-cyber-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-accent" />
            <span>Accepted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-cyber-danger bg-transparent" />
            <span>Reverted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan" />
            <span>Baseline</span>
          </div>
        </div>
      </div>

      {/* SVG Scatter Plot */}
      <div className="relative w-full flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-2xl overflow-visible select-none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              {/* Horizontal grid line */}
              <line
                x1={padding}
                y1={getY(tick)}
                x2={width - padding}
                y2={getY(tick)}
                stroke="#1e2c4f"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 10}
                y={getY(tick) + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {tick}%
              </text>

              {/* Vertical grid line */}
              <line
                x1={getX(tick)}
                y1={padding}
                x2={getX(tick)}
                y2={height - padding}
                stroke="#1e2c4f"
                strokeDasharray="4 4"
              />
              <text
                x={getX(tick)}
                y={height - padding + 18}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Axes labels */}
          <text
            x={width / 2}
            y={height - 10}
            fill="#94a3b8"
            fontSize="11"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            Attacks Blocked (Security &rarr;)
          </text>

          <text
            x={15}
            y={height / 2}
            fill="#94a3b8"
            fontSize="11"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Honest Completion (Utility &rarr;)
          </text>

          {/* Connect Pareto Frontier Line */}
          <path
            d={`M ${getX(25)} ${getY(100)} L ${getX(75)} ${getY(100)} L ${getX(100)} ${getY(100)}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="3 3"
            opacity="0.5"
          />

          {/* Data Points */}
          {FRONTIER_POINTS.map((pt) => {
            const cx = getX(pt.attacks_blocked);
            const cy = getY(pt.tasks_completed);
            const isSelected = selectedPoint.config_id === pt.config_id;
            const isBaseline = pt.config_id === "e3be49d9d0";

            return (
              <g
                key={pt.config_id}
                className="cursor-pointer transition-all"
                onClick={() => setSelectedPoint(pt)}
              >
                {/* Outer halo when selected */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="none"
                    stroke={pt.accepted ? "#10b981" : "#ef4444"}
                    strokeWidth="2"
                    className="animate-ping"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 7 : 5}
                  fill={
                    isBaseline
                      ? "#06b6d4"
                      : pt.accepted
                      ? "#10b981"
                      : "transparent"
                  }
                  stroke={pt.accepted ? "#10b981" : "#ef4444"}
                  strokeWidth={pt.accepted ? "2" : "3"}
                />

                {/* Short text label */}
                <text
                  x={cx}
                  y={cy - 10}
                  fill={isSelected ? "#ffffff" : "#94a3b8"}
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {pt.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Detail Box for Selected Config */}
      <div className="p-4 rounded-lg bg-cyber-card border border-cyber-border space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyber-text text-sm">{selectedPoint.label}</span>
            <span className="text-[10px] text-cyber-muted">ID: {selectedPoint.config_id}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              selectedPoint.accepted
                ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40"
                : "bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/40"
            }`}
          >
            {selectedPoint.accepted ? "GATE ACCEPTED" : "GATE REVERTED"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-cyber-border/60 text-[11px]">
          <div>
            <span className="text-cyber-muted">Attacks Blocked:</span>{" "}
            <span className="text-cyber-accent font-bold">{selectedPoint.attacks_blocked}%</span>
          </div>
          <div>
            <span className="text-cyber-muted">Tasks Completed:</span>{" "}
            <span className="text-cyber-text font-bold">{selectedPoint.tasks_completed}%</span>
          </div>
          <div>
            <span className="text-cyber-muted">Utility Toll:</span>{" "}
            <span className={100 - selectedPoint.tasks_completed > 10 ? "text-cyber-danger font-bold" : "text-cyber-accent font-bold"}>
              {(100 - selectedPoint.tasks_completed).toFixed(1)} pts
            </span>
          </div>
          <div>
            <span className="text-cyber-muted">Frontier Status:</span>{" "}
            <span className="text-cyber-cyan font-bold">{selectedPoint.on_frontier ? "Pareto Optimal" : "Sub-optimal"}</span>
          </div>
        </div>

        {selectedPoint.gate_failed && selectedPoint.gate_failed.length > 0 && (
          <div className="mt-2 p-2 rounded bg-cyber-danger/10 border border-cyber-danger/30 text-[11px] text-rose-300">
            <span className="font-bold">Failed Rules:</span> {selectedPoint.gate_failed.join(" &middot; ")}
          </div>
        )}
      </div>
    </div>
  );
};
