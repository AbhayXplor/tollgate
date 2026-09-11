"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Terminal, MessageSquare, Activity, ExternalLink, Flame } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-cyber-surface border border-cyber-border flex items-center justify-center group-hover:border-cyber-accent transition-colors">
            <Shield className="w-5 h-5 text-cyber-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-cyber-text font-mono">
                TOLLGATE
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyber-card border border-cyber-border text-cyber-accent">
                Release Gate
              </span>
            </div>
            <p className="text-[11px] text-cyber-muted font-mono hidden sm:block">
              break &rarr; patch &rarr; price &rarr; ship or revert
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded transition-colors ${
              pathname === "/"
                ? "text-cyber-accent bg-cyber-surface border border-cyber-border"
                : "text-cyber-dim hover:text-cyber-text hover:bg-cyber-surface/50"
            }`}
          >
            Overview & Stage
          </Link>
          <Link
            href="/orin"
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              pathname === "/orin"
                ? "text-cyber-accent bg-cyber-surface border border-cyber-border"
                : "text-cyber-dim hover:text-cyber-text hover:bg-cyber-surface/50"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyber-cyan" />
            /orin (Helpdesk)
          </Link>
          <Link
            href="/warroom"
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              pathname === "/warroom"
                ? "text-cyber-accent bg-cyber-surface border border-cyber-border"
                : "text-cyber-dim hover:text-cyber-text hover:bg-cyber-surface/50"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyber-danger" />
            /warroom (Theater)
          </Link>
        </nav>

        {/* Status indicator & GitHub */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyber-surface border border-cyber-border text-[11px] font-mono text-cyber-dim">
            <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
            <span>Booth Ready</span>
          </div>

          <a
            href="https://github.com/AbhayXplor/tollgate"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-cyber-dim hover:text-cyber-text bg-cyber-surface border border-cyber-border hover:border-cyber-borderGlow transition-colors"
          >
            <span className="hidden sm:inline">GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
