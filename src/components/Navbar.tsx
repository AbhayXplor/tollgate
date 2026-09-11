"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, ArrowUpRight, Compass } from "lucide-react";
import { TOUR_EVENT } from "./GuidedTour";

const NAV_LINKS = [
  { href: "/", label: "Overview & Stage", short: "Overview" },
  { href: "/orin", label: "Orin Helpdesk", short: "Orin" },
  { href: "/warroom", label: "War Room Theater", short: "War Room" },
];

const SegmentedNav: React.FC<{ pathname: string; className?: string }> = ({ pathname, className = "" }) => (
  <nav aria-label="Primary" className={`items-center p-1 rounded-full bg-black/[0.04] ${className}`}>
    {NAV_LINKS.map((link) => {
      const active = pathname === link.href;
      return (
        <Link
          key={link.href}
          href={link.href}
          aria-current={active ? "page" : undefined}
          className={`flex-1 md:flex-none text-center whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
            active
              ? "bg-white text-apple-text shadow-pill"
              : "text-apple-secondary hover:text-apple-text"
          }`}
        >
          <span className="md:hidden">{link.short}</span>
          <span className="hidden md:inline">{link.label}</span>
        </Link>
      );
    })}
  </nav>
);

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  // The tour lives on the home page: start it in place there, or navigate home and start it.
  const startTour = () => {
    if (pathname === "/") window.dispatchEvent(new Event(TOUR_EVENT));
    else router.push("/?tour=1");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand lockup */}
        <Link href="/" className="flex items-center gap-2.5 rounded-lg">
          <span className="w-8 h-8 rounded-[9px] bg-apple-blue flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            <Shield className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-apple-text">Tollgate</span>
          <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/[0.05] text-apple-secondary">
            Release Gate
          </span>
          <span className="hidden xl:inline text-[12px] text-apple-muted pl-1">
            break &rarr; patch &rarr; price &rarr; ship or revert
          </span>
        </Link>

        <SegmentedNav pathname={pathname} className="hidden md:flex" />

        {/* Status & GitHub */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={startTour}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-apple-blue hover:bg-apple-blue/[0.08] transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            Tour
          </button>
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34c759]/[0.1] text-[12px] font-medium text-[#248a3d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
            Booth Ready
          </span>
          <a
            href="https://github.com/AbhayXplor/tollgate"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium text-apple-text bg-white border border-black/[0.1] hover:border-black/[0.2] transition-colors"
          >
            GitHub
            <ArrowUpRight className="w-3.5 h-3.5 text-apple-muted" />
          </a>
        </div>
      </div>

      {/* Mobile: the same segmented control on its own row */}
      <div className="md:hidden px-4 pb-2.5">
        <SegmentedNav pathname={pathname} className="flex justify-between" />
      </div>
    </header>
  );
};
