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
import { MessageSquare, Terminal, Maximize2, Copy, Check } from "lucide-react";

type StageTab = "orin" | "warroom";

const STAGE_TABS: { id: StageTab; label: string; Icon: typeof MessageSquare }[] = [
  { id: "orin", label: "Orin Helpdesk", Icon: MessageSquare },
  { id: "warroom", label: "War Room Theater", Icon: Terminal },
];

// Hairline dividers between the four rules: 1 column on mobile, 2×2 on tablet, 1×4 on desktop.
const RULE_CELL_BORDERS = [
  "",
  "border-t sm:border-t-0 sm:border-l sm:pl-6",
  "border-t lg:border-t-0 lg:border-l lg:pl-6",
  "border-t lg:border-t-0 sm:border-l sm:pl-6",
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<StageTab>("orin");
  const [copied, setCopied] = useState(false);

  const openStage = (tab: StageTab) => {
    setActiveTab(tab);
    document.getElementById("stage")?.scrollIntoView({ behavior: "smooth" });
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText("tollgate demo --mock");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context); the command stays selectable.
    }
  };

  return (
    <div className="space-y-28 sm:space-y-36">
      {/* 1. HERO */}
      <section className="pt-10 sm:pt-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[14px] sm:text-[15px] font-medium text-apple-secondary">
            School of Cyber Defense &middot; GISEC 2026
          </p>

          <h1 className="mt-2 text-[64px] sm:text-[88px] lg:text-[96px] leading-[0.95] font-bold tracking-[-0.045em] text-apple-text">
            Tollgate
          </h1>

          <p className="mt-5 text-[24px] sm:text-[28px] leading-tight font-semibold tracking-[-0.025em] text-apple-text">
            The release gate for AI agent security.
          </p>
          <p className="mt-2.5 mx-auto max-w-[40rem] text-[17px] sm:text-[19px] leading-relaxed text-apple-secondary [text-wrap:balance]">
            Break &rarr; patch &rarr; price &rarr; ship or revert. Verdicts from tool logs, never opinions.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openStage("orin")}
              className="px-6 py-3 rounded-full bg-apple-blue text-white text-[15px] font-medium hover:bg-apple-blueHover transition-colors"
            >
              Test Orin Helpdesk
            </button>
            <button
              type="button"
              onClick={() => openStage("warroom")}
              className="px-6 py-3 rounded-full bg-white border border-black/[0.12] text-apple-text text-[15px] font-medium hover:border-black/[0.24] transition-colors"
            >
              Launch War Room
            </button>
            <a
              href="#results"
              className="px-3 py-3 rounded-full text-apple-blue text-[15px] font-medium hover:underline underline-offset-4"
            >
              Explore Frontier
            </a>
          </div>

          <div className="mt-10 sm:mt-12">
            <HeroScene />
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM & THE TOLL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-[15px] font-semibold text-[#b25e00]">The unmeasured cost of safety</p>
            <h2 className="mt-2 text-[34px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.03em] text-apple-text">
              Claude Fable blocked coding tasks. GPT flagged translations.
            </h2>
            <p className="mt-5 max-w-[62ch] text-[17px] leading-[1.6] text-apple-secondary">
              When frontier labs ship safety filters, they celebrate attack-blocking numbers. Nobody measures what
              broke for honest users. Anthropic shipped Claude Fable 5 with over-broad classifiers that refused
              legitimate programming work. OpenAI filters flagged benign foreign language idioms as hate speech.
            </p>

            <figure className="mt-8 apple-card p-6 sm:p-7">
              <figcaption className="text-[13px] font-medium text-apple-muted">The Tollgate formula</figcaption>
              <p className="mt-2 text-[24px] sm:text-[32px] leading-tight font-semibold tracking-[-0.025em] text-apple-text">
                The Toll = TCR(baseline) &minus; TCR(candidate)
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-apple-secondary">
                Points of honest utility lost to safety guardrails. If a patch blocks 100% of attacks but has a Toll
                &gt; 10 points, <strong className="font-semibold text-apple-text">Tollgate automatically reverts it.</strong>
              </p>
            </figure>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm">
              <TollMeter toll={62.5} title="Fable-scale utility collapse" subtitle="Demonstrating an un-gated aggressive patch" />
            </div>
          </div>
        </div>

        {/* The four gate rules */}
        <div className="mt-16">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-apple-text">
            The gate ships a patch only if all four rules hold.
          </h3>
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-black/[0.08]">
            {OFFICIAL_SUMMARY.gate_rules.map((rule, i) => (
              <div key={rule.id} className={`py-5 sm:pr-6 border-black/[0.08] ${RULE_CELL_BORDERS[i] ?? ""}`}>
                <dt className="flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold text-apple-blue tabular-nums">{rule.id}</span>
                  <span className="text-[15px] font-semibold text-apple-text">{rule.name}</span>
                </dt>
                <dd className="mt-1.5 text-[14px] leading-relaxed text-apple-secondary">{rule.condition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 3. THE MAIN STAGE (LIVE DEMO PANEL) */}
      <section id="stage" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-32 md:scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="flex items-center gap-2.5 text-[34px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.03em] text-apple-text">
              <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-[#34c759] opacity-60 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-[#34c759]" />
              </span>
              Live demo stage
            </h2>
            <p className="mt-2 text-[17px] leading-relaxed text-apple-secondary">
              Switch seamlessly between Helpdesk agent and War Room theater without leaving the page.
            </p>
          </div>

          {/* Segmented control with a sliding thumb */}
          <div
            role="tablist"
            aria-label="Demo"
            className="relative grid grid-cols-2 p-1 rounded-full bg-black/[0.05] shrink-0 self-start md:self-auto"
          >
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-pill transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: activeTab === "warroom" ? "translateX(100%)" : "translateX(0)" }}
            />
            {STAGE_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={activeTab === id}
                aria-controls="stage-panel"
                onClick={() => setActiveTab(id)}
                className={`relative z-10 flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === id ? "text-apple-text" : "text-apple-secondary hover:text-apple-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div id="stage-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="mt-8">
          {activeTab === "orin" ? <ChatPanel /> : <TheaterFeed />}
          <div className="mt-4 text-right">
            <Link
              href={activeTab === "orin" ? "/orin" : "/warroom"}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-apple-blue hover:underline underline-offset-4"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Open full-screen {activeTab === "orin" ? "/orin" : "/warroom"} route
            </Link>
          </div>
        </div>
      </section>

      {/* 4. RESULTS & FRONTIER */}
      <section id="results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-32 md:scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[15px] font-semibold text-apple-blue">Official empirical benchmarks</p>
          <h2 className="mt-2 text-[34px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.03em] text-apple-text">
            Security &harr; Utility Frontier
          </h2>
          <p className="mt-4 text-[17px] leading-[1.6] text-apple-secondary">
            Every candidate defense is plotted across security gains and utility retention. Tollgate proves that max
            security doesn&apos;t require destroying honest work.
          </p>
        </div>

        <div className="mt-10">
          <FrontierChart />
        </div>

        <div className="mt-20">
          <ConfigCards />
        </div>

        {/* Cold-start verification */}
        <div className="mt-20 apple-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-apple-text">Cold-start reproducibility</h3>
            <p className="mt-1 text-[14px] text-apple-secondary">
              Run offline rehearsal locally. 100 tests pass without requiring an external API key.
            </p>
          </div>

          <div className="flex items-center gap-1 self-start md:self-auto rounded-xl bg-apple-subtle border border-black/[0.06] pl-4 pr-1.5 py-1.5">
            <code className="font-mono text-[14px] text-apple-text whitespace-nowrap">
              <span className="text-apple-faint select-none">$ </span>
              tollgate demo --mock
            </code>
            <button
              type="button"
              onClick={copyCommand}
              aria-label={copied ? "Copied" : "Copy command"}
              className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center text-apple-muted hover:text-apple-text hover:bg-black/[0.05] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#248a3d]" /> : <Copy className="w-4 h-4" />}
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? "Command copied" : ""}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
