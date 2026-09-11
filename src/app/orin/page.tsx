"use client";

import React from "react";
import Link from "next/link";
import { ChatPanel } from "@/components/ChatPanel";
import { ArrowLeft, MessageSquare, Info } from "lucide-react";

export default function OrinPage() {
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
            <MessageSquare className="w-5 h-5 text-cyber-cyan" />
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-cyber-text">
              ORIN // IT Helpdesk Agent Interface
            </h1>
          </div>
          <p className="text-xs text-cyber-dim font-mono mt-1">
            Northwind Systems Enterprise Support &middot; Active Tool &amp; Guard Interceptor
          </p>
        </div>

        <div className="p-3 rounded-lg bg-cyber-card border border-cyber-border text-xs font-mono text-cyber-dim max-w-sm">
          <div className="flex items-center gap-1.5 text-cyber-accent font-bold mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>Judge Demo Tip:</span>
          </div>
          Try the &ldquo;Fable Test: Lookalike Benign&rdquo; scenario with D2-Aggressive enabled vs disabled to observe the false-alarm refusal.
        </div>
      </div>

      {/* Main Chat Interface */}
      <ChatPanel showSidebarControls={true} />
    </div>
  );
}
