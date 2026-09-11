import React from "react";

export type StatusTone = "green" | "amber" | "red" | "redSolid" | "blue" | "indigo" | "neutral";

const TONES: Record<StatusTone, string> = {
  green: "bg-[#34c759]/[0.12] text-[#248a3d]",
  amber: "bg-[#ff9500]/[0.12] text-[#b25e00]",
  red: "bg-[#ff3b30]/[0.1] text-[#d70015]",
  redSolid: "bg-[#d70015] text-white",
  blue: "bg-[#0071e3]/[0.08] text-[#0062c4]",
  indigo: "bg-[#5856d6]/[0.1] text-[#4240b8]",
  neutral: "bg-black/[0.05] text-[#515154]",
};

interface StatusPillProps {
  tone: StatusTone;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

/**
 * Machine verdicts (gate decisions, tool statuses, event types) are the only
 * uppercase text on the site — the capitals mark them as system output.
 */
export const StatusPill: React.FC<StatusPillProps> = ({ tone, icon, size = "md", className = "", children }) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold uppercase tracking-[0.02em] ${
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
    } ${TONES[tone]} ${className}`}
  >
    {icon}
    {children}
  </span>
);
