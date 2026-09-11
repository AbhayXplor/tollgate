"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/** Window event that (re)starts the tour on the home page. */
export const TOUR_EVENT = "tollgate:tour";

export interface TourStep {
  id: string;
  /** Value of the `data-tour` attribute to spotlight. Omit for a centered card. */
  target?: string;
  /** A smaller element to spotlight on phones, where `target` stacks taller than the screen. */
  mobileTarget?: string;
  title: string;
  body: React.ReactNode;
  /** Runs when the step opens, e.g. to switch the demo tab the target lives in. */
  onEnter?: () => void;
  /**
   * Where the card sits when the target is too tall to leave room above or below it.
   * Pick a spot over empty space inside the target. Defaults to the bottom edge.
   */
  overlay?: "bottom" | "top-right" | "middle-right";
}

interface GuidedTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

type Rect = { top: number; left: number; width: number; height: number };

const SPOT_PAD = 8;
const GAP = 14;
const MOBILE = 640;

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5);

const findTarget = (step?: TourStep) => {
  if (!step) return null;
  const id = window.innerWidth < MOBILE && step.mobileTarget ? step.mobileTarget : step.target;
  return id ? document.querySelector<HTMLElement>(`[data-tour="${id}"]`) : null;
};

const headerHeight = () => document.querySelector("header")?.getBoundingClientRect().height ?? 64;

/**
 * A step-by-step spotlight tour. Each step dims the page, cuts a highlighted window
 * around one element, and places an explanation card next to it.
 */
export const GuidedTour: React.FC<GuidedTourProps> = ({ steps, open, onClose }) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = useState(220);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const cardRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  // Start from the first step each time the tour opens; restore focus when it closes.
  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setIndex(0);
    } else {
      returnFocusRef.current?.focus?.();
    }
  }, [open]);

  // Enter a step: run its hook, then scroll its target into a comfortable position.
  useEffect(() => {
    if (!open) return;
    const current = steps[index];
    current.onEnter?.();
    if (!current.target) return;

    let cancelled = false;
    let tries = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scrollToTarget = () => {
      if (cancelled) return;
      const el = findTarget(current);
      // The target may appear a frame later (e.g. after a tab switch).
      if (!el) {
        if (tries++ < 90) requestAnimationFrame(scrollToTarget);
        return;
      }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const header = headerHeight();
      const mobile = window.innerWidth < MOBILE;
      const cardSpace = (cardRef.current?.offsetHeight ?? 220) + GAP;
      const usable = vh - header;
      let viewTop: number; // where the target's top edge should land in the viewport
      if (mobile || r.height + cardSpace > usable - 32) {
        viewTop = header + 16;
      } else {
        viewTop = header + (usable - (r.height + cardSpace)) / 2;
      }
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - viewTop), behavior: reduced ? "auto" : "smooth" });
    };
    requestAnimationFrame(scrollToTarget);
    return () => {
      cancelled = true;
    };
    // `steps` is rebuilt every render by the parent; the step index is the real dependency.
  }, [open, index]);

  // Track the target's on-screen box every frame so the spotlight follows scrolling and layout shifts.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      const el = findTarget(steps[index]);
      let next: Rect | null = null;
      if (el) {
        const r = el.getBoundingClientRect();
        next = {
          top: r.top - SPOT_PAD,
          left: r.left - SPOT_PAD,
          width: r.width + SPOT_PAD * 2,
          height: r.height + SPOT_PAD * 2,
        };
      }
      setRect((prev) => (sameRect(prev, next) ? prev : next));
      setViewport((prev) =>
        prev.w === window.innerWidth && prev.h === window.innerHeight ? prev : { w: window.innerWidth, h: window.innerHeight }
      );
      if (cardRef.current) {
        const h = cardRef.current.offsetHeight;
        setCardHeight((prev) => (Math.abs(prev - h) < 1 ? prev : h));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, index]);

  // Move focus to the card on each step so screen readers announce it.
  useEffect(() => {
    if (open) cardRef.current?.focus({ preventScroll: true });
  }, [open, index]);

  // Keyboard: Esc closes, arrow keys step through.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && !isLast) setIndex((i) => i + 1);
      else if (e.key === "ArrowLeft" && !isFirst) setIndex((i) => i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isFirst, isLast, onClose]);

  if (!open || !step) return null;

  const { w: vw, h: vh } = viewport;
  const mobile = vw < MOBILE;
  const cardWidth = Math.min(380, vw - 32);

  // Spotlight window: the target's box, or a zero-size point at the center for intro/outro cards.
  const spot: Rect = rect ?? { top: vh / 2, left: vw / 2, width: 0, height: 0 };

  // Card placement: below the target if it fits, else above, else pinned to the bottom edge.
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { width: cardWidth, left: (vw - cardWidth) / 2, top: Math.max(24, (vh - cardHeight) / 2) };
  } else if (mobile) {
    cardStyle = { left: 16, right: 16, bottom: 16 };
  } else {
    const spaceBelow = vh - (rect.top + rect.height);
    const spaceAbove = rect.top - headerHeight();
    const clampLeft = (x: number) => Math.min(Math.max(x, 16), vw - cardWidth - 16);
    const clampTop = (y: number) => Math.min(Math.max(y, headerHeight() + 12), vh - cardHeight - 16);
    let top: number;
    let left = clampLeft(rect.left + rect.width / 2 - cardWidth / 2);
    if (spaceBelow >= cardHeight + GAP + 16) top = rect.top + rect.height + GAP;
    else if (spaceAbove >= cardHeight + GAP + 16) top = rect.top - cardHeight - GAP;
    else if (step.overlay === "top-right") {
      top = clampTop(rect.top + 20);
      left = clampLeft(rect.left + rect.width - cardWidth - 20);
    } else if (step.overlay === "middle-right") {
      top = clampTop(rect.top + rect.height / 2 - cardHeight / 2);
      left = clampLeft(rect.left + rect.width - cardWidth - 28);
    } else top = vh - cardHeight - 24;
    cardStyle = { width: cardWidth, top, left };
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Blocks page clicks while the tour is open */}
      <div className="absolute inset-0" aria-hidden="true" />

      {/* Dimmed page with a highlighted window around the target */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none rounded-[20px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          boxShadow: rect
            ? "0 0 0 2px #0071e3, 0 0 0 6px rgba(0, 113, 227, 0.18), 0 0 0 9999px rgba(12, 12, 16, 0.55)"
            : "0 0 0 9999px rgba(12, 12, 16, 0.55)",
        }}
      />

      {/* Explanation card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        className="absolute bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25),0_2px_8px_rgba(0,0,0,0.08)] p-5 outline-none transition-[top,left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={cardStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium text-apple-muted tabular-nums">
            {isFirst || isLast ? "Quick tour" : `Step ${index} of ${steps.length - 2}`}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the tour"
            className="-mr-1.5 -mt-1 w-8 h-8 rounded-full flex items-center justify-center text-apple-muted hover:text-apple-text hover:bg-black/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 id="tour-title" className="mt-1 text-[19px] font-semibold tracking-[-0.02em] text-apple-text">
          {step.title}
        </h2>
        <div id="tour-body" className="mt-2 text-[14px] leading-relaxed text-apple-secondary">
          {step.body}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {/* Progress */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-4 bg-apple-blue" : i < index ? "w-1.5 bg-apple-blue/40" : "w-1.5 bg-black/[0.12]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {isFirst ? (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-full text-[14px] font-medium text-apple-secondary hover:text-apple-text hover:bg-black/[0.04] transition-colors"
              >
                Skip
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="px-3 py-2 rounded-full text-[14px] font-medium text-apple-secondary hover:text-apple-text hover:bg-black/[0.04] transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
              className="px-4 py-2 rounded-full bg-apple-blue text-white text-[14px] font-medium hover:bg-apple-blueHover transition-colors"
            >
              {isFirst ? "Start the tour" : isLast ? "Start exploring" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
