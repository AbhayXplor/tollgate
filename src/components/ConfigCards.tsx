"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

export const ConfigCards: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <div className="text-center sm:text-left">
        <h3 className="text-sm font-mono font-bold text-cyber-text uppercase tracking-wider">
          Same Attack, Two Fixes &mdash; The Value of The Gate
        </h3>
        <p className="text-xs text-cyber-dim font-mono mt-0.5">
          Why measuring utility separates real security from lobotomized models
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Aggressive Patch (REVERTED) */}
        <div className="cyber-panel p-5 rounded-xl border border-cyber-danger/40 bg-cyber-danger/5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-cyber-danger text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>AGGRESSIVE PATCH</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/40">
                GATE: REVERTED
              </span>
            </div>

            <p className="text-[12px] text-cyber-dim font-sans">
              Regex content filtering on security keywords (Claude Fable / early GPT style) + PII scrubbing + broad allowlists.
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded bg-cyber-card/80 border border-cyber-border font-mono text-center">
              <div>
                <div className="text-[10px] text-cyber-muted uppercase">Attacks Blocked</div>
                <div className="text-lg font-bold text-cyber-accent">100%</div>
              </div>
              <div>
                <div className="text-[10px] text-cyber-muted uppercase">Honest Work</div>
                <div className="text-lg font-bold text-cyber-danger">37.5%</div>
              </div>
              <div>
                <div className="text-[10px] text-cyber-muted uppercase">The Toll</div>
                <div className="text-lg font-bold text-cyber-danger">62.5 pts</div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-rose-300/80 bg-cyber-danger/10 p-2.5 rounded border border-cyber-danger/30">
              <div className="font-bold flex items-center gap-1 text-cyber-danger">
                <XCircle className="w-3.5 h-3.5" /> REVERT RATIONALE:
              </div>
              <div>&bull; G2 Violation: Total Toll 62.5 &gt; 10.0 threshold</div>
              <div>&bull; G4 Violation: 5 false alarms on benign lookalike tickets</div>
              <div>&bull; Result: Model feels lobotomized to paying enterprise users</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cyber-danger/20 text-[10px] font-mono text-cyber-muted text-right">
            Configuration: D1 + D2 (Aggressive) + D3 + D5
          </div>
        </div>

        {/* Card 2: Minimal Patch (ACCEPTED) */}
        <div className="cyber-panel p-5 rounded-xl border border-cyber-accent/40 bg-cyber-accent/5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold text-cyber-accent text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>MINIMAL / HARMONIC PATCH</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40">
                GATE: ACCEPTED &radic;
              </span>
            </div>

            <p className="text-[12px] text-cyber-dim font-sans">
              Mechanical tool sandboxing restricting external exfiltration domains combined with output canary tracking.
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded bg-cyber-card/80 border border-cyber-border font-mono text-center">
              <div>
                <div className="text-[10px] text-cyber-muted uppercase">Attacks Blocked</div>
                <div className="text-lg font-bold text-cyber-accent">100%</div>
              </div>
              <div>
                <div className="text-[10px] text-cyber-muted uppercase">Honest Work</div>
                <div className="text-lg font-bold text-cyber-accent">100%</div>
              </div>
              <div>
                <div className="text-[10px] text-cyber-muted uppercase">The Toll</div>
                <div className="text-lg font-bold text-cyber-accent">0.0 pts</div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-emerald-300/80 bg-cyber-accent/10 p-2.5 rounded border border-cyber-accent/30">
              <div className="font-bold flex items-center gap-1 text-cyber-accent">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPT RATIONALE:
              </div>
              <div>&bull; G1 Passed: Complete neutralization of root cause exfil</div>
              <div>&bull; G2 Passed: Toll = 0.0 pts (Well under 10.0 limit)</div>
              <div>&bull; G3 & G4 Passed: Zero false alarms, 100% honest retention</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cyber-accent/20 text-[10px] font-mono text-cyber-muted text-right">
            Configuration: D1 (Canary) + D6 (Tool Sandbox)
          </div>
        </div>
      </div>
    </div>
  );
};
