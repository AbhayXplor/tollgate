"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  OrinSimulator,
  ChatMessage,
  DefensesConfig,
  DEFAULT_DEFENSES,
  PRESET_PROMPTS,
  ToolCall,
} from "@/lib/orin-engine";
import { TollMeter } from "./TollMeter";
import { StatusPill, StatusTone } from "./StatusPill";
import {
  ArrowUp,
  RotateCcw,
  Shield,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Bot,
  ChevronRight,
} from "lucide-react";

interface ChatPanelProps {
  initialPrompt?: string;
  showSidebarControls?: boolean;
}

const shortTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const GREETING =
  "Hello! I am **Orin**, Northwind Systems IT Helpdesk AI. I can assist with employee directory queries, credentials reset, and ticket triage.";

const SCENARIO_DOT: Record<string, string> = {
  honest: "#34c759",
  lookalike: "#ff9500",
  attack: "#ff3b30",
  direct_attack: "#ff3b30",
};

const DEFENSE_ROWS: {
  key: keyof DefensesConfig;
  code: string;
  name: string;
  description: string;
  highToll?: boolean;
}[] = [
  { key: "d1_canary", code: "D1", name: "Canary Leak Oracle", description: "Inspects outputs for token leaks" },
  { key: "d6_sandbox", code: "D6", name: "Tool Sandboxing", description: "Restricts external exfiltration domains" },
  { key: "d2_classifier", code: "D2", name: "Minimal Input Classifier", description: "Catches explicit injection keywords" },
  {
    key: "d2_aggressive",
    code: "D2",
    name: "Aggressive (Fable Mode)",
    description: "Broad refusal of benign security words",
    highToll: true,
  },
  { key: "d3_pii_mask", code: "D3", name: "PII & Credential Scrubbing", description: "Redacts passwords & sensitive fields" },
  { key: "d5_approval", code: "D5", name: "Human Approval Gate", description: "Requires manual confirmation" },
];

/** Renders the engine's **bold** markers as real emphasis. */
const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split("**").map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold">
          {part}
        </strong>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    )}
  </>
);

const formatArgs = (args: Record<string, unknown>) =>
  Object.entries(args)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ");

const TOOL_STATUS_TONE: Record<ToolCall["status"], StatusTone> = {
  completed: "green",
  allowed: "green",
  executing: "neutral",
  blocked: "red",
};

const VERDICTS: Record<string, { tone: StatusTone; label: string; Icon: typeof CheckCircle2 }> = {
  breach: { tone: "red", label: "BREACH DETECTED", Icon: AlertOctagon },
  false_alarm: { tone: "amber", label: "FALSE ALARM (FABLE DILEMMA)", Icon: XCircle },
  blocked_attack: { tone: "green", label: "ATTACK BLOCKED", Icon: CheckCircle2 },
};

/** Xcode-style collapsible execution trace. */
const ToolTrace: React.FC<{ calls: ToolCall[]; open: boolean; onToggle: () => void }> = ({ calls, open, onToggle }) => {
  const blocked = calls.filter((c) => c.status === "blocked").length;
  return (
    <div className="rounded-xl border border-black/[0.06] bg-apple-subtle overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-apple-secondary hover:bg-black/[0.03] transition-colors"
      >
        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        <Wrench className="w-3.5 h-3.5 text-apple-muted" />
        <span className="font-medium text-apple-text">Execution trace</span>
        <span className="text-apple-muted">
          {calls.length} tool {calls.length === 1 ? "call" : "calls"}
        </span>
        {blocked > 0 && <span className="ml-auto font-medium text-[#d70015]">{blocked} blocked</span>}
      </button>
      {open && (
        <ol className="border-t border-black/[0.06] divide-y divide-black/[0.05] bg-white/60">
          {calls.map((tc) => (
            <li key={tc.id} className="px-3 py-2.5 space-y-1">
              <div className="flex items-start justify-between gap-3">
                <code className="font-mono text-[11px] leading-relaxed text-apple-text break-all">
                  <span className="text-apple-faint select-none">{tc.step} </span>
                  <span className="font-semibold text-[#4240b8]">{tc.name}</span>
                  <span className="text-apple-muted">(</span>
                  {formatArgs(tc.arguments)}
                  <span className="text-apple-muted">)</span>
                </code>
                <StatusPill tone={TOOL_STATUS_TONE[tc.status]} size="sm" className="shrink-0 mt-0.5">
                  {tc.status}
                </StatusPill>
              </div>
              {tc.result && (
                <p className="font-mono text-[11px] leading-relaxed text-apple-muted break-all line-clamp-3" title={tc.result}>
                  &rarr; {tc.result}
                </p>
              )}
              {tc.blockedBy && (
                <p className="text-[12px] leading-snug font-medium text-[#d70015] flex items-start gap-1">
                  <XCircle className="w-3.5 h-3.5 mt-px shrink-0" />
                  {tc.blockedBy}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  initialPrompt = "",
  showSidebarControls = true,
}) => {
  const [defenses, setDefenses] = useState<DefensesConfig>(DEFAULT_DEFENSES);
  const [simulator] = useState(() => new OrinSimulator(DEFAULT_DEFENSES));
  // The greeting's timestamp starts as a stable placeholder so server and client render the
  // same markup; the real clock time is filled in after hydration.
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "init", role: "assistant", content: GREETING, timestamp: "Ready" },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [isProcessing, setIsProcessing] = useState(false);
  const [collapsedTraces, setCollapsedTraces] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const time = shortTime();
    setMessages((prev) => prev.map((m) => (m.id === "init" && m.timestamp === "Ready" ? { ...m, timestamp: time } : m)));
  }, []);

  // Keep the newest message in view without scrolling the page itself.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isProcessing]);

  const toggleDefense = (key: keyof DefensesConfig) => {
    const updated = { ...defenses, [key]: !defenses[key] };
    // If enabling d2_aggressive, also enable d2_classifier
    if (key === "d2_aggressive" && !defenses.d2_aggressive) {
      updated.d2_classifier = true;
    }
    setDefenses(updated);
    simulator.setDefenses(updated);
  };

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setInput("");

    await simulator.runStep(text, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    setIsProcessing(false);
  };

  const handleReset = () => {
    setCollapsedTraces({});
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: "Reset complete. Orin IT Helpdesk ready. Current defenses updated.",
        timestamp: shortTime(),
      },
    ]);
  };

  const metrics = simulator.computeMetrics();

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Conversation */}
      <div
        className={`apple-card flex flex-col h-[680px] overflow-hidden ${
          showSidebarControls ? "lg:col-span-8" : "lg:col-span-12"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#3d9bff] to-[#0071e3] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold tracking-[-0.01em] text-apple-text">Orin</span>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#248a3d]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                  Online
                </span>
              </div>
              <p className="text-[12px] text-apple-muted truncate">
                IT Helpdesk Agent, Northwind Systems Internal Enterprise Support
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-apple-secondary hover:text-apple-text hover:bg-black/[0.04] transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Demo scenarios */}
        <div data-tour="scenarios" className="px-4 py-2.5 border-b border-black/[0.06] bg-apple-bg flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-apple-muted shrink-0 pr-1">Demo scenarios</span>
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSend(p.prompt)}
              disabled={isProcessing}
              title={p.description}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[12px] font-medium text-apple-text hover:border-black/[0.18] hover:shadow-pill disabled:opacity-50 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SCENARIO_DOT[p.type] }} />
              {p.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5" aria-live="polite">
          {messages.map((m) => {
            const isUser = m.role === "user";
            const isGuard = m.role === "guard";
            const verdict = m.verdict ? VERDICTS[m.verdict] : undefined;
            const traceOpen = !collapsedTraces[m.id];

            return (
              <div key={m.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-5 ${
                      isGuard ? "bg-[#ff3b30]/[0.1] text-[#d70015]" : "bg-apple-subtle text-apple-secondary"
                    }`}
                  >
                    {isGuard ? <Shield className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-2 ${isUser ? "items-end" : ""}`}>
                  <div
                    className={`flex items-baseline gap-2 px-1 text-[11px] ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className={`font-medium ${isGuard ? "text-[#d70015]" : "text-apple-secondary"}`}>
                      {isUser ? "You" : isGuard ? "Tollgate Guard" : "Orin"}
                    </span>
                    <span className="text-apple-muted tabular-nums">{m.timestamp}</span>
                  </div>

                  <div
                    className={`px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? "bg-apple-blue text-white rounded-[20px] rounded-br-md"
                        : isGuard
                        ? "bg-[#ff3b30]/[0.08] border border-[#ff3b30]/20 text-[#d70015] rounded-[20px] rounded-bl-md"
                        : "bg-apple-subtle text-apple-text rounded-[20px] rounded-bl-md"
                    }`}
                  >
                    <RichText text={m.content} />
                  </div>

                  {verdict && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] text-apple-muted">Verdict</span>
                      <StatusPill tone={verdict.tone} size="sm" icon={<verdict.Icon className="w-3 h-3" />}>
                        {verdict.label}
                      </StatusPill>
                    </div>
                  )}

                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <ToolTrace
                      calls={m.toolCalls}
                      open={traceOpen}
                      onToggle={() => setCollapsedTraces((prev) => ({ ...prev, [m.id]: traceOpen }))}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-apple-subtle flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-apple-secondary" />
              </div>
              <div className="flex items-center gap-1 px-4 py-3 rounded-[20px] rounded-bl-md bg-apple-subtle">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-apple-faint animate-typing"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[12px] text-apple-muted">Orin is thinking and checking guard rules...</span>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-3 sm:px-4 py-3 border-t border-black/[0.06]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="orin-input" className="sr-only">
              Message Orin
            </label>
            <input
              id="orin-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Orin to reset a password, read ticket TKT-9102, or test an injection..."
              className="flex-1 min-w-0 bg-white border border-black/[0.1] focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/15 rounded-full px-4 py-2.5 text-[14px] text-apple-text placeholder:text-apple-faint outline-none transition-shadow"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              aria-label="Send"
              className="w-10 h-10 shrink-0 rounded-full bg-apple-blue text-white flex items-center justify-center hover:bg-apple-blueHover disabled:bg-black/[0.08] disabled:text-apple-faint disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar: live Toll and the defense matrix */}
      {showSidebarControls && (
        <div className="lg:col-span-4 space-y-6">
          <TollMeter
            toll={parseFloat(metrics.toll)}
            title="Active config toll"
            subtitle="Calculated live from active defense parameters"
          />

          <div data-tour="defense-matrix" className="apple-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-apple-text">Defense matrix</h3>
              <StatusPill tone={metrics.gateStatus === "ACCEPTED" ? "green" : "red"}>
                GATE {metrics.gateStatus}
              </StatusPill>
            </div>

            <ul className="divide-y divide-black/[0.06] border-t border-black/[0.06]">
              {DEFENSE_ROWS.map((row) => {
                const on = defenses[row.key];
                const danger = row.highToll && on;
                const id = `defense-${row.key}`;
                return (
                  <li key={row.key} className={danger ? "bg-[#ff3b30]/[0.05]" : undefined}>
                    <label htmlFor={id} className="flex items-center justify-between gap-4 px-5 py-3 cursor-pointer">
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-px rounded-md tabular-nums ${
                              danger ? "bg-[#ff3b30]/[0.12] text-[#d70015]" : "bg-black/[0.05] text-apple-secondary"
                            }`}
                          >
                            {row.code}
                          </span>
                          <span
                            className={`text-[14px] font-medium ${danger ? "text-[#d70015]" : "text-apple-text"}`}
                          >
                            {row.name}
                          </span>
                          {row.highToll && (
                            <StatusPill tone="red" size="sm">
                              High Toll
                            </StatusPill>
                          )}
                        </span>
                        <span className="block mt-0.5 text-[12px] text-apple-muted">{row.description}</span>
                      </span>

                      {/* iOS switch */}
                      <span className="relative inline-flex shrink-0">
                        <input
                          id={id}
                          type="checkbox"
                          role="switch"
                          checked={on}
                          onChange={() => toggleDefense(row.key)}
                          className="peer sr-only"
                        />
                        <span
                          className={`block w-[44px] h-[26px] rounded-full bg-[#e5e5ea] transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-apple-blue peer-focus-visible:ring-offset-2 ${
                            row.highToll ? "peer-checked:bg-[#ff3b30]" : "peer-checked:bg-[#34c759]"
                          }`}
                        />
                        <span className="absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full bg-white shadow-thumb transition-transform duration-200 peer-checked:translate-x-[18px]" />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
