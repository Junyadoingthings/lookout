"use client";

import { Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { nlSearchAction } from "@/app/alerts/ai-actions";

/**
 * Natural-language search. The question is turned into a structured filter by the
 * model, the filter is shown for transparency, then applied to the URL. No raw
 * AI-written SQL is ever run: the filter only sets the same severity/status/text
 * params the manual filters use.
 */
export function AiSearch({ aiReady }: { aiReady: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [built, setBuilt] = useState<string | null>(null);

  if (!aiReady) return null;

  const ask = () =>
    start(async () => {
      const res = await nlSearchAction(q);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const f = res.filter;
      const params = new URLSearchParams();
      if (f.severity?.length) params.set("sev", f.severity.join(","));
      if (f.status?.length) params.set("status", f.status.join(","));
      if (f.text) params.set("q", f.text);
      setBuilt(f.explanation);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles size={15} className="text-accent" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder='Ask in plain English, e.g. "critical powershell alerts still open"'
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground placeholder:text-muted-2 focus:border-accent focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={ask}
          disabled={pending || !q.trim()}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Thinking" : "Ask AI"}
        </button>
      </div>
      {built && (
        <p className="mt-2 text-xs text-muted">
          <span className="text-muted-2">Filter built:</span> {built}
        </p>
      )}
    </div>
  );
}
