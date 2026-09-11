"use client";

import React, { useState } from "react";
import {
  OrinSimulator,
  ChatMessage,
  DefensesConfig,
  DEFAULT_DEFENSES,
  PRESET_PROMPTS,
} from "@/lib/orin-engine";
import { TollMeter } from "./TollMeter";
import {
  Send,
  RotateCcw,
  Shield,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Bot,
  User,
  Sliders,
  Sparkles,
} from "lucide-react";

interface ChatPanelProps {
  initialPrompt?: string;
  showSidebarControls?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  initialPrompt = "",
  showSidebarControls = true,
}) => {
  const [defenses, setDefenses] = useState<DefensesConfig>(DEFAULT_DEFENSES);
  const [simulator] = useState(() => new OrinSimulator(DEFAULT_DEFENSES));
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I am **Orin**, Northwind Systems IT Helpdesk AI. I can assist with employee directory queries, credentials reset, and ticket triage.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update simulator when defenses state changes
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

    // Run step through simulator
    const result = await simulator.runStep(text, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    setIsProcessing(false);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "init",
        role: "assistant",
        content:
          "Reset complete. Orin IT Helpdesk ready. Current defenses updated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const metrics = simulator.computeMetrics();

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Chat Interface */}
      <div className={`cyber-panel rounded-xl flex flex-col h-[650px] border border-cyber-border overflow-hidden ${showSidebarControls ? "lg:col-span-8" : "lg:col-span-12"}`}>
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-cyber-border bg-cyber-surface/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyber-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-cyber-text font-mono">
                  ORIN // IT Helpdesk Agent
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-cyber-dim font-mono">
                Northwind Systems Internal Enterprise Support
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono text-cyber-dim hover:text-cyber-text bg-cyber-card border border-cyber-border hover:border-cyber-borderGlow transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Preset Prompt Buttons */}
        <div className="px-4 py-2 bg-cyber-surface/40 border-b border-cyber-border/40 flex flex-wrap gap-2 text-xs font-mono">
          <span className="text-cyber-muted text-[11px] flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-cyber-accent" /> Demo Scenarios:
          </span>
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSend(p.prompt)}
              className={`px-2.5 py-1 rounded border text-[11px] transition-all ${
                p.type === "honest"
                  ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40"
                  : p.type === "lookalike"
                  ? "border-amber-800/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40"
                  : "border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40"
              }`}
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            const isGuard = m.role === "guard";

            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed font-sans ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                      isGuard
                        ? "bg-cyber-danger/20 border border-cyber-danger text-cyber-danger"
                        : "bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan"
                    }`}
                  >
                    {isGuard ? <Shield className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                )}

                <div className={`max-w-[80%] space-y-2`}>
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isUser
                        ? "bg-cyber-card border-cyber-border text-cyber-text"
                        : isGuard
                        ? "bg-cyber-danger/10 border-cyber-danger/40 text-rose-200"
                        : "bg-cyber-surface border-cyber-border text-cyber-text"
                    }`}
                  >
                    {/* Timestamp / Tag */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyber-muted mb-1">
                      <span>{isUser ? "You" : isGuard ? "TOLLGATE GUARD" : "Orin"}</span>
                      <span>{m.timestamp}</span>
                    </div>

                    {/* Content */}
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Verdict Flag */}
                    {m.verdict && (
                      <div className="mt-2 pt-2 border-t border-cyber-border/40 flex items-center gap-2 font-mono text-[10px]">
                        {m.verdict === "breach" && (
                          <span className="text-cyber-danger font-bold flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> VERDICT: BREACH DETECTED
                          </span>
                        )}
                        {m.verdict === "false_alarm" && (
                          <span className="text-cyber-warning font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> VERDICT: FALSE ALARM (FABLE DILEMMA)
                          </span>
                        )}
                        {m.verdict === "blocked_attack" && (
                          <span className="text-cyber-accent font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> VERDICT: ATTACK BLOCKED
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline Tool Calls Timeline */}
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="space-y-1.5 pl-2 border-l-2 border-cyber-border">
                      <div className="text-[10px] font-mono text-cyber-dim flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-cyber-warning" />
                        <span>Execution Trace ({m.toolCalls.length} tool calls):</span>
                      </div>
                      {m.toolCalls.map((tc) => (
                        <div
                          key={tc.id}
                          className="p-2 rounded bg-cyber-card/90 border border-cyber-border/80 font-mono text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-cyber-cyan font-bold">
                              🔧 {tc.name}({JSON.stringify(tc.arguments)})
                            </span>
                            <span
                              className={`text-[9px] uppercase px-1 rounded ${
                                tc.status === "blocked"
                                  ? "bg-cyber-danger/30 text-cyber-danger border border-cyber-danger/40"
                                  : "bg-cyber-accent/20 text-cyber-accent"
                              }`}
                            >
                              {tc.status}
                            </span>
                          </div>
                          {tc.result && (
                            <div className="text-[10px] text-cyber-dim truncate">
                              &rarr; {tc.result}
                            </div>
                          )}
                          {tc.blockedBy && (
                            <div className="text-[10px] text-cyber-danger">
                              &times; {tc.blockedBy}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded bg-cyber-card border border-cyber-border flex items-center justify-center shrink-0 mt-0.5 text-cyber-dim">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyber-dim animate-pulse">
              <Bot className="w-4 h-4 text-cyber-cyan animate-spin" />
              <span>Orin is thinking and checking guard rules...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-cyber-border bg-cyber-surface/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Orin to reset a password, read ticket TKT-9102, or test an injection..."
              className="flex-1 bg-cyber-card border border-cyber-border focus:border-cyber-accent rounded-lg px-3.5 py-2 text-xs font-mono text-cyber-text placeholder:text-cyber-muted outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-4 py-2 bg-cyber-accent text-cyber-bg font-bold font-mono text-xs rounded-lg hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar Controls & Toll Meter */}
      {showSidebarControls && (
        <div className="lg:col-span-4 space-y-6">
          {/* Real-time Toll Meter */}
          <TollMeter
            toll={parseFloat(metrics.toll)}
            title="ACTIVE CONFIG TOLL"
            subtitle="Calculated live from active defense parameters"
          />

          {/* Defense Configuration Rack */}
          <div className="cyber-panel p-5 rounded-xl border border-cyber-border space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyber-text">
                <Sliders className="w-4 h-4 text-cyber-accent" />
                <span>DEFENSE MATRIX</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  metrics.gateStatus === "ACCEPTED"
                    ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40"
                    : "bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/40"
                }`}
              >
                GATE: {metrics.gateStatus}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {/* D1 Canary */}
              <label className="flex items-center justify-between p-2 rounded bg-cyber-surface/60 border border-cyber-border/60 cursor-pointer hover:border-cyber-border">
                <div>
                  <div className="font-semibold text-cyber-text">D1: Canary Leak Oracle</div>
                  <div className="text-[10px] text-cyber-muted">Inspects outputs for token leaks</div>
                </div>
                <input
                  type="checkbox"
                  checked={defenses.d1_canary}
                  onChange={() => toggleDefense("d1_canary")}
                  className="rounded border-cyber-border text-cyber-accent focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              {/* D6 Tool Sandbox */}
              <label className="flex items-center justify-between p-2 rounded bg-cyber-surface/60 border border-cyber-border/60 cursor-pointer hover:border-cyber-border">
                <div>
                  <div className="font-semibold text-cyber-text">D6: Tool Sandboxing</div>
                  <div className="text-[10px] text-cyber-muted">Restricts external exfiltration domains</div>
                </div>
                <input
                  type="checkbox"
                  checked={defenses.d6_sandbox}
                  onChange={() => toggleDefense("d6_sandbox")}
                  className="rounded border-cyber-border text-cyber-accent focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              {/* D2 Classifier */}
              <label className="flex items-center justify-between p-2 rounded bg-cyber-surface/60 border border-cyber-border/60 cursor-pointer hover:border-cyber-border">
                <div>
                  <div className="font-semibold text-cyber-text">D2: Minimal Input Classifier</div>
                  <div className="text-[10px] text-cyber-muted">Catches explicit injection keywords</div>
                </div>
                <input
                  type="checkbox"
                  checked={defenses.d2_classifier}
                  onChange={() => toggleDefense("d2_classifier")}
                  className="rounded border-cyber-border text-cyber-accent focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              {/* D2 Aggressive (The Fable Switch) */}
              <label className="flex items-center justify-between p-2 rounded bg-cyber-danger/10 border border-cyber-danger/30 cursor-pointer hover:border-cyber-danger">
                <div>
                  <div className="font-semibold text-cyber-danger flex items-center gap-1.5">
                    <span>D2-Aggressive (Fable Mode)</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-cyber-danger/20 text-cyber-danger">
                      High Toll
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-300/70">Broad refusal of benign security words</div>
                </div>
                <input
                  type="checkbox"
                  checked={defenses.d2_aggressive}
                  onChange={() => toggleDefense("d2_aggressive")}
                  className="rounded border-cyber-danger text-cyber-danger focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              {/* D3 PII Mask */}
              <label className="flex items-center justify-between p-2 rounded bg-cyber-surface/60 border border-cyber-border/60 cursor-pointer hover:border-cyber-border">
                <div>
                  <div className="font-semibold text-cyber-text">D3: PII & Credential Scrubbing</div>
                  <div className="text-[10px] text-cyber-muted">Redacts passwords & sensitive fields</div>
                </div>
                <input
                  type="checkbox"
                  checked={defenses.d3_pii_mask}
                  onChange={() => toggleDefense("d3_pii_mask")}
                  className="rounded border-cyber-border text-cyber-accent focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              {/* D5 Human Approval */}
              <label className="flex items-center justify-between p-2 rounded bg-cyber-surface/60 border border-cyber-border/60 cursor-pointer hover:border-cyber-border">
                <div>
                  <div className="font-semibold text-cyber-text">D5: Human Approval Gate</div>
                  <div className="text-[10px] text-cyber-muted">Requires manual confirmation</div>
                </div>
                <input
                  type="checkbox"
                  checked={defenses.d5_approval}
                  onChange={() => toggleDefense("d5_approval")}
                  className="rounded border-cyber-border text-cyber-accent focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
