"use client";

import { ArrowUp, Bot, Loader2, Sparkles, Wrench, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
  steps?: string[];
}

const SUGGESTIONS = [
  "What should I triage first?",
  "Where are my detection gaps?",
  "How accurate has the AI been?",
];

function routeLabel(path: string): string {
  if (path.startsWith("/alerts/")) return "alert detail";
  if (path.startsWith("/alerts")) return "alerts queue";
  if (path.startsWith("/cases")) return "cases";
  if (path.startsWith("/coverage")) return "coverage";
  if (path.startsWith("/detections")) return "detections";
  if (path.startsWith("/lab")) return "lab";
  return "console";
}

function alertIdFrom(path: string): string | undefined {
  const m = path.match(/^\/alerts\/([0-9a-f-]{8,})/i);
  return m?.[1];
}

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const history: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages([...history, { role: "assistant", content: "", steps: [] }]);
      setInput("");
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const update = (fn: (m: Msg) => Msg) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") next[next.length - 1] = fn(last);
          return next;
        });

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            context: { route: routeLabel(pathname), alertId: alertIdFrom(pathname) },
          }),
          signal: controller.signal,
        });

        if (!res.body) throw new Error("No response stream.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const raw of lines) {
            if (!raw.trim()) continue;
            let evt: { type: string; text?: string; summary?: string; message?: string };
            try {
              evt = JSON.parse(raw);
            } catch {
              continue;
            }
            if (evt.type === "token" && evt.text) {
              update((m) => ({ ...m, content: m.content + evt.text }));
            } else if (evt.type === "step" && evt.summary) {
              update((m) => ({ ...m, steps: [...(m.steps ?? []), evt.summary!] }));
            } else if (evt.type === "error" && evt.message) {
              update((m) => ({ ...m, content: m.content || `Error: ${evt.message}` }));
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          update((m) => ({
            ...m,
            content: m.content || "Something went wrong reaching the copilot.",
          }));
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, pathname],
  );

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        aria-label={open ? "Close copilot" : "Open copilot"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent text-white shadow-lg transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
          open && "scale-0 opacity-0",
        )}
      >
        <Sparkles size={20} />
      </button>

      {/* Backdrop on small screens */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Lookout Copilot"
        className={cn(
          "fixed right-0 bottom-0 z-50 flex h-[min(620px,92dvh)] w-full flex-col border border-border bg-surface shadow-2xl transition-transform duration-200 ease-out sm:right-4 sm:bottom-4 sm:w-[400px] sm:rounded-xl",
          open ? "translate-y-0" : "pointer-events-none translate-y-[110%]",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Bot size={16} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Lookout Copilot</div>
              <div className="text-[11px] text-muted">Read-only. You decide.</div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Ask about your alerts, cases, coverage or detection rules. I read the real data and
                help you triage. I never change anything.
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm text-foreground transition hover:border-accent/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <Bubble key={i} msg={m} busy={busy && i === messages.length - 1} />
            ))
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-border p-3"
        >
          <div className="flex items-end gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 focus-within:border-accent/50">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder="Ask the copilot…"
              className="max-h-28 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-2 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-white transition enabled:hover:brightness-110 disabled:opacity-40"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

function Bubble({ msg, busy }: { msg: Msg; busy: boolean }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-white">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {msg.steps && msg.steps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {msg.steps.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
            >
              <Wrench size={10} />
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-surface-2 px-3 py-2 text-sm whitespace-pre-wrap text-foreground">
        {msg.content || (busy ? <Loader2 size={14} className="animate-spin text-muted" /> : null)}
      </div>
    </div>
  );
}
