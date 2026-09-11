"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HeroScene } from "@/components/HeroScene";
import { TollMeter } from "@/components/TollMeter";
import { ChatPanel } from "@/components/ChatPanel";
import { TheaterFeed } from "@/components/TheaterFeed";
import { FrontierChart } from "@/components/FrontierChart";
import { ConfigCards } from "@/components/ConfigCards";
import { OFFICIAL_SUMMARY } from "@/lib/results-data";
import {
  Shield,
  Terminal,
  MessageSquare,
  Flame,
  ArrowRight,
  Sparkles,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
} from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"orin" | "warroom">("orin");
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("tollgate demo --mock");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 md:pt-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-surface border border-cyber-border text-xs font-mono text-cyber-accent">
            <Sparkles className="w-3.5 h-3.5 text-cyber-accent" />
            <span>School of Cyber Defense &middot; GISEC 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-mono text-cyber-text">
            TOLLGATE
          </h1>

          <p className="max-w-2xl text-lg sm:text-xl text-cyber-dim font-sans leading-relaxed">
            The release gate for AI agent security.{" "}
            <span className="text-cyber-text font-semibold">
              Break &rarr; patch &rarr; price &rarr; ship or revert.
            </span>{" "}
            Verdicts from tool logs, never opinions.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
            <button
              onClick={() => {
                setActiveTab("orin");
                document.getElementById("stage")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-5 py-2.5 rounded-lg bg-cyber-accent text-cyber-bg font-bold hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Test Orin Helpdesk</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("warroom");
                document.getElementById("stage")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-5 py-2.5 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text font-bold hover:border-cyber-borderGlow transition-all flex items-center gap-2"
            >
              <Terminal className="w-4 h-4 text-cyber-danger" />
              <span>Launch War Room</span>
            </button>

            <a
              href="#results"
              className="px-5 py-2.5 rounded-lg bg-cyber-card border border-cyber-border text-cyber-dim hover:text-cyber-text transition-all flex items-center gap-2"
            >
              <Scale className="w-4 h-4 text-cyber-cyan" />
              <span>Explore Frontier</span>
            </a>
          </div>

          {/* 3D Hero Scene */}
          <div className="w-full max-w-5xl pt-4">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM & THE TOLL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="cyber-panel p-8 sm:p-10 rounded-2xl border border-cyber-border relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: The Fable / GPT Hook */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-cyber-warning">
                <Flame className="w-4 h-4" />
                <span>THE UNMEASURED COST OF SAFETY</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-cyber-text leading-tight">
                Claude Fable blocked coding tasks. GPT flagged translations.
              </h2>

              <p className="text-sm text-cyber-dim leading-relaxed">
                When frontier labs ship safety filters, they celebrate attack-blocking numbers.
                Nobody measures what broke for honest users. Anthropic shipped Claude Fable 5 with
                over-broad classifiers that refused legitimate programming work. OpenAI filters
                flagged benign foreign language idioms as hate speech.
              </p>

              <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border font-mono text-xs space-y-2">
                <div className="text-cyber-accent font-bold">THE TOLLGATE FORMULA:</div>
                <div className="text-cyber-text">
                  <code>The Toll = TCR(baseline) &minus; TCR(candidate)</code>
                </div>
                <div className="text-[11px] text-cyber-dim">
                  Points of honest utility lost to safety guardrails. If a patch blocks 100% of
                  attacks but has a Toll &gt; 10 points, <strong className="text-cyber-danger">Tollgate automatically reverts it.</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                {OFFICIAL_SUMMARY.gate_rules.map((rule) => (
                  <div key={rule.id} className="p-2.5 rounded bg-cyber-surface border border-cyber-border/80">
                    <div className="text-cyber-accent font-bold">{rule.id}</div>
                    <div className="text-[10px] text-cyber-dim mt-1">{rule.condition}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Toll Meter Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm">
                <TollMeter
                  toll={62.5}
                  title="FABLE-SCALE UTILITY COLLAPSE"
                  subtitle="Demonstrating an un-gated aggressive patch"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE MAIN STAGE (LIVE DEMO PANEL) */}
      <section id="stage" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-accent animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-cyber-text">
                LIVE DEMO STAGE
              </h2>
            </div>
            <p className="text-xs text-cyber-dim font-mono mt-1">
              Switch seamlessly between Helpdesk agent and War Room theater without leaving the page
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-cyber-card border border-cyber-border font-mono text-xs">
            <button
              onClick={() => setActiveTab("orin")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "orin"
                  ? "bg-cyber-accent text-cyber-bg font-bold shadow"
                  : "text-cyber-dim hover:text-cyber-text"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Orin Helpdesk</span>
            </button>

            <button
              onClick={() => setActiveTab("warroom")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "warroom"
                  ? "bg-cyber-danger text-cyber-text font-bold shadow"
                  : "text-cyber-dim hover:text-cyber-text"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>War Room Theater</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === "orin" ? (
            <div>
              <ChatPanel />
              <div className="mt-3 text-right">
                <Link
                  href="/orin"
                  className="text-xs font-mono text-cyber-cyan hover:underline inline-flex items-center gap-1"
                >
                  <span>Open full-screen /orin route</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <TheaterFeed />
              <div className="mt-3 text-right">
                <Link
                  href="/warroom"
                  className="text-xs font-mono text-cyber-danger hover:underline inline-flex items-center gap-1"
                >
                  <span>Open full-screen /warroom route</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. RESULTS & FRONTIER */}
      <section id="results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-20">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyber-cyan">
            <Scale className="w-4 h-4" />
            <span>OFFICIAL EMPIRICAL BENCHMARKS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-cyber-text">
            Security &harr; Utility Frontier
          </h2>
          <p className="text-xs sm:text-sm text-cyber-dim max-w-3xl font-sans">
            Every candidate defense is plotted across security gains and utility retention.
            Tollgate proves that max security doesn&apos;t require destroying honest work.
          </p>
        </div>

        {/* Frontier Scatter Plot */}
        <FrontierChart />

        {/* Side-by-side Config Comparison Cards */}
        <ConfigCards />

        {/* Cold-start verification */}
        <div className="cyber-panel p-6 rounded-xl border border-cyber-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="space-y-1 text-left">
            <div className="font-bold text-cyber-text flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyber-accent" />
              <span>COLD-START REPRODUCIBILITY</span>
            </div>
            <p className="text-[11px] text-cyber-dim">
              Run offline rehearsal locally. 100 tests pass without requiring an external API key.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-cyber-card border border-cyber-border px-3 py-2 rounded-lg text-cyber-accent">
            <code>tollgate demo --mock</code>
            <button
              onClick={copyCommand}
              className="p-1 hover:text-cyber-text transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-cyber-accent" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
