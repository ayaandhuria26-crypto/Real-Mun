"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi — I'm Dias, your Real-MUN support. Ask me anything about the site, the mock conference, or MUN procedure. How can I help?",
};

const QUICK_PROMPTS = [
  "How does the mock conference work?",
  "Is Real-MUN really free?",
  "How do I submit a position paper?",
  "What's a moderated caucus?",
];

export default function DiasAI() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("realmun_dias_history");
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (parsed.length > 0) setMessages(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "realmun_dias_history",
        JSON.stringify(messages.slice(-20))
      );
    } catch { /* ignore */ }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Hide on live conference page — AFTER all hooks
  if (pathname === "/conference/live") return null;

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/dias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't reach the server. Try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const showQuick = messages.length <= 1;

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: "380px",
            maxHeight: "640px",
            background: "var(--color-card)",
            border: "1px solid var(--color-border-strong)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: "var(--color-ink)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              D
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm" style={{ color: "var(--color-paper)" }}>
                Dias AI
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(245,243,237,0.6)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Real-MUN support
              </div>
            </div>
            <button
              onClick={() => { setMessages([GREETING]); }}
              title="Clear chat"
              className="p-1.5 rounded transition"
              style={{ color: "rgba(245,243,237,0.5)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded transition"
              style={{ color: "rgba(245,243,237,0.5)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: "460px" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="rounded-xl px-3 py-2 text-sm max-w-[85%]"
                  style={{
                    background:
                      m.role === "user" ? "var(--color-ink)" : "var(--color-card)",
                    color:
                      m.role === "user" ? "var(--color-paper)" : "var(--color-ink)",
                    border: m.role === "assistant" ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted)",
                  }}
                >
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            {/* Quick prompts */}
            {showQuick && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full border transition"
                    style={{
                      borderColor: "var(--color-border-strong)",
                      color: "var(--color-ink)",
                      background: "var(--color-surface)",
                      cursor: "pointer",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 flex gap-2 items-end"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask Dias anything…"
              className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-border)",
                maxHeight: "100px",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition"
              style={{
                background: input.trim() ? "var(--color-accent)" : "var(--color-surface)",
                color: input.trim() ? "#fff" : "var(--color-muted)",
                cursor: input.trim() ? "pointer" : "default",
              }}
              aria-label="Send"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Launcher button */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {!open && (
          <div
            className="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
          >
            Ask Dias AI
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="relative group w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition"
          style={{ background: "var(--color-ink)" }}
          aria-label="Open Dias AI"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-paper)" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-paper)" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                style={{ background: "var(--color-accent)", border: "2px solid var(--color-ink)" }}
              />
            </>
          )}
        </button>
      </div>
    </>
  );
}
