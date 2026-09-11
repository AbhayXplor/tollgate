"use client";

import React from "react";
import { CheckCircle2, XCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { StatusPill } from "./StatusPill";

interface PatchCard {
  name: string;
  accepted: boolean;
  description: string;
  stats: { label: string; value: string; good: boolean }[];
  rationaleTitle: string;
  rationale: { rule?: string; verdict: string; text: string }[];
  configuration: string;
}

const CARDS: PatchCard[] = [
  {
    name: "Aggressive patch",
    accepted: false,
    description:
      "Regex content filtering on security keywords (Claude Fable / early GPT style) + PII scrubbing + broad allowlists.",
    stats: [
      { label: "Attacks Blocked", value: "100%", good: true },
      { label: "Honest Work", value: "37.5%", good: false },
      { label: "The Toll", value: "62.5 pts", good: false },
    ],
    rationaleTitle: "Revert rationale",
    rationale: [
      { rule: "G2", verdict: "Violation", text: "Total Toll 62.5 > 10.0 threshold" },
      { rule: "G4", verdict: "Violation", text: "5 false alarms on benign lookalike tickets" },
      { verdict: "Result", text: "Model feels lobotomized to paying enterprise users" },
    ],
    configuration: "D1 + D2 (Aggressive) + D3 + D5",
  },
  {
    name: "Minimal / harmonic patch",
    accepted: true,
    description:
      "Mechanical tool sandboxing restricting external exfiltration domains combined with output canary tracking.",
    stats: [
      { label: "Attacks Blocked", value: "100%", good: true },
      { label: "Honest Work", value: "100%", good: true },
      { label: "The Toll", value: "0.0 pts", good: true },
    ],
    rationaleTitle: "Accept rationale",
    rationale: [
      { rule: "G1", verdict: "Passed", text: "Complete neutralization of root cause exfil" },
      { rule: "G2", verdict: "Passed", text: "Toll = 0.0 pts (Well under 10.0 limit)" },
      { rule: "G3 & G4", verdict: "Passed", text: "Zero false alarms, 100% honest retention" },
    ],
    configuration: "D1 (Canary) + D6 (Tool Sandbox)",
  },
];

export const ConfigCards: React.FC = () => {
  return (
    <div className="w-full">
      <div className="max-w-2xl">
        <h3 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.025em] text-apple-text">
          Same attack, two fixes.
        </h3>
        <p className="mt-1.5 text-[17px] leading-relaxed text-apple-secondary">
          The value of the gate: why measuring utility separates real security from lobotomized models.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {CARDS.map((card) => {
          const Icon = card.accepted ? ShieldCheck : ShieldAlert;
          const accent = card.accepted
            ? { border: "border-[#34c759]/30", iconBg: "bg-[#34c759]/[0.12]", ink: "text-[#248a3d]" }
            : { border: "border-[#ff3b30]/25", iconBg: "bg-[#ff3b30]/[0.1]", ink: "text-[#d70015]" };

          return (
            <article key={card.name} className={`apple-card ${accent.border} p-6 flex flex-col`}>
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${accent.iconBg} ${accent.ink}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <h4 className="text-[17px] font-semibold tracking-[-0.01em] text-apple-text">{card.name}</h4>
                </div>
                <StatusPill tone={card.accepted ? "green" : "red"}>
                  {card.accepted ? "GATE ACCEPTED" : "GATE REVERTED"}
                </StatusPill>
              </header>

              <p className="mt-3 text-[14px] leading-relaxed text-apple-secondary">{card.description}</p>

              <dl className="mt-5 grid grid-cols-3 rounded-xl bg-apple-subtle divide-x divide-black/[0.06]">
                {card.stats.map((s) => (
                  <div key={s.label} className="px-3 py-3.5 text-center">
                    <dt className="text-[12px] text-apple-muted">{s.label}</dt>
                    <dd
                      className={`mt-1 text-[22px] sm:text-[24px] font-semibold tracking-[-0.02em] ${
                        s.good ? "text-[#248a3d]" : "text-[#d70015]"
                      }`}
                    >
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5">
                <p className={`flex items-center gap-1.5 text-[13px] font-semibold ${accent.ink}`}>
                  {card.accepted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {card.rationaleTitle}
                </p>
                <ul className="mt-2.5 space-y-2">
                  {card.rationale.map((item) => (
                    <li key={item.text} className="flex items-start gap-2.5 text-[14px] leading-snug">
                      <span className="w-[52px] shrink-0 pt-px text-[12px] font-semibold text-apple-text tabular-nums">
                        {item.rule ?? ""}
                      </span>
                      <span className="text-apple-secondary">
                        <span className="font-medium text-apple-text">{item.verdict}:</span> {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="mt-auto pt-5">
                <p className="border-t border-black/[0.06] pt-4 text-[12px] text-apple-muted">
                  Configuration: <span className="text-apple-secondary font-medium">{card.configuration}</span>
                </p>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
};
