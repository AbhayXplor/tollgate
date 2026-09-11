import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChatPanel } from "@/components/ChatPanel";
import { ChevronLeft, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Orin Helpdesk — Tollgate",
};

export default function OrinPage() {
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
            Orin
          </h1>
          <p className="mt-1 text-[21px] tracking-[-0.015em] text-apple-secondary">IT Helpdesk Agent Interface</p>
          <p className="mt-2 text-[14px] text-apple-muted">
            Northwind Systems Enterprise Support &middot; Active Tool &amp; Guard Interceptor
          </p>
        </div>

        <aside className="apple-card p-4 max-w-md">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-apple-text">
            <Info className="w-4 h-4 text-apple-blue" />
            Judge Demo Tip
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-apple-secondary">
            Try the &ldquo;Fable Test: Lookalike Benign&rdquo; scenario with D2-Aggressive enabled vs disabled to observe
            the false-alarm refusal.
          </p>
        </aside>
      </div>

      <div className="mt-8">
        <ChatPanel showSidebarControls={true} />
      </div>
    </div>
  );
}
