"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "K"], label: "Command menu" },
  { keys: ["j"], label: "Move down the queue" },
  { keys: ["k"], label: "Move up the queue" },
  { keys: ["enter"], label: "Open the selected alert" },
  { keys: ["t"], label: "Mark true positive" },
  { keys: ["f"], label: "Mark false positive" },
  { keys: ["e"], label: "Escalate" },
  { keys: ["?"], label: "This help" },
];

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-2 hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="divide-y divide-border">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-muted">{s.label}</span>
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-foreground"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
