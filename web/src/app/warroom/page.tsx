import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TheaterFeed } from "@/components/TheaterFeed";
import { ChevronLeft, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "War Room Theater — Tollgate",
};

export default function WarRoomPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
      <Link
        href="/"
        className="inline-flex items-center gap-0.5 text-[14px] font-medium text-apple-blue hover:underline underline-offset-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Stage Overview
      </Link>

      <div className="mt-5 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-[40px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.035em] text-apple-text">
            War Room
          </h1>
          <p className="mt-1 text-[21px] tracking-[-0.015em] text-apple-secondary">Red Team Adversarial Theater</p>
          <p className="mt-2 text-[14px] text-apple-muted">
            Real-time evolution loop &middot; Break &rarr; Patch &rarr; Price &rarr; Ship or Revert
          </p>
        </div>

        <aside className="apple-card p-4 max-w-md">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-apple-text">
            <ShieldAlert className="w-4 h-4 text-[#d70015]" />
            The Auto-Revert Gate
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-apple-secondary">
            Watch Round 1 revert an aggressive classifier when The Toll exceeds 10 points!
          </p>
        </aside>
      </div>

      <div className="mt-8">
        <TheaterFeed />
      </div>
    </div>
  );
}
