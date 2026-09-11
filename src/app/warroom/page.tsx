"use client";

import React from "react";
import Link from "next/link";
import { TheaterFeed } from "@/components/TheaterFeed";
import { ArrowLeft, Terminal, ShieldAlert } from "lucide-react";

export default function WarRoomPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyber-muted hover:text-cyber-accent transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&larr; Back to Stage Overview</span>
          </Link>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyber-danger" />
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-cyber-text">
              WAR ROOM // Red Team Adversarial Theater
            </h1>
          </div>
          <p className="text-xs text-cyber-dim font-mono mt-1">
            Real-time evolution loop &middot; Break &rarr; Patch &rarr; Price &rarr; Ship or Revert
          </p>
        </div>

        <div className="p-3 rounded-lg bg-cyber-card border border-cyber-border text-xs font-mono text-cyber-dim max-w-sm">
          <div className="flex items-center gap-1.5 text-cyber-danger font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>The Auto-Revert Gate:</span>
          </div>
          Watch Round 1 revert an aggressive classifier when The Toll exceeds 10 points!
        </div>
      </div>

      {/* Main Theater Interface */}
      <TheaterFeed />
    </div>
  );
}
