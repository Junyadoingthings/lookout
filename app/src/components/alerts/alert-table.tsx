"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { setAlertStatus } from "@/app/alerts/actions";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import type { AlertListItem } from "@/db/queries";
import { SEVERITY_META } from "@/lib/ui/meta";
import { cn, relativeTime } from "@/lib/utils";

type SortKey = "time" | "severity" | "host";

function SortHeader({
  label,
  k,
  className,
  sortKey,
  sortDir,
  toggleSort,
}: {
  label: string;
  k: SortKey;
  className?: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  toggleSort: (k: SortKey) => void;
}) {
  return (
    <th className={cn("px-3 py-2 text-left font-medium", className)}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 text-muted hover:text-foreground"
      >
        {label}
        {sortKey === k && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
}

export function AlertTable({ alerts }: { alerts: AlertListItem[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const sorted = useMemo(() => {
    const rows = [...alerts];
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "time")
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      else if (sortKey === "severity")
        cmp = SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank;
      else cmp = a.agentName.localeCompare(b.agentName);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [alerts, sortKey, sortDir]);

  const open = useCallback((id: string) => router.push(`/alerts/${id}`), [router]);

  const verdict = useCallback(
    async (id: string, status: string, label: string) => {
      try {
        await setAlertStatus(id, status);
        toast.success(`Marked ${label}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update");
      }
    },
    [router],
  );

  // Keyboard navigation: j/k move, enter open, t/f/e set verdict.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!sorted.length) return;
      const row = sorted[Math.min(selected, sorted.length - 1)];
      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelected((i) => Math.min(i + 1, sorted.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelected((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          if (row) {
            e.preventDefault();
            open(row.id);
          }
          break;
        case "t":
          if (row) void verdict(row.id, "true_positive", "true positive");
          break;
        case "f":
          if (row) void verdict(row.id, "false_positive", "false positive");
          break;
        case "e":
          if (row) void verdict(row.id, "escalated", "escalated");
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sorted, selected, open, verdict]);

  useEffect(() => {
    rowRefs.current[selected]?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface-2 text-xs">
          <tr className="border-b border-border">
            <SortHeader label="Sev" k="severity" className="w-20" {...{ sortKey, sortDir, toggleSort }} />
            <th className="px-3 py-2 text-left font-medium text-muted">Rule</th>
            <SortHeader label="Host" k="host" className="hidden w-36 md:table-cell" {...{ sortKey, sortDir, toggleSort }} />
            <th className="hidden px-3 py-2 text-left font-medium text-muted lg:table-cell">
              ATT&CK
            </th>
            <th className="hidden px-3 py-2 text-left font-medium text-muted sm:table-cell">
              Status
            </th>
            <SortHeader label="Time" k="time" className="w-16 text-right" {...{ sortKey, sortDir, toggleSort }} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => {
            const isSel = i === selected;
            return (
              <tr
                key={a.id}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                onClick={() => {
                  setSelected(i);
                  open(a.id);
                }}
                onMouseEnter={() => setSelected(i)}
                className={cn(
                  "cursor-pointer border-b border-border/60 transition-colors",
                  isSel ? "bg-surface-hover" : "hover:bg-surface-hover/60",
                )}
              >
                <td className="px-3 py-2 align-top">
                  <SeverityBadge severity={a.severity} showLabel={false} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {a.isSample === 1 && (
                      <span className="rounded bg-warn/15 px-1 text-[10px] font-medium text-warn">
                        SAMPLE
                      </span>
                    )}
                    <span className="line-clamp-1 text-foreground">{a.ruleDescription}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-muted-2">
                    <span>#{a.ruleId}</span>
                    {a.processName && <span className="truncate">{a.processName}</span>}
                  </div>
                </td>
                <td className="hidden px-3 py-2 align-top font-mono text-xs text-muted md:table-cell">
                  {a.agentName}
                </td>
                <td className="hidden px-3 py-2 align-top lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {a.mitreIds.slice(0, 2).map((id) => (
                      <span
                        key={id}
                        className="rounded border border-border bg-surface-2 px-1 py-0.5 font-mono text-[10px] text-muted"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="hidden px-3 py-2 align-top sm:table-cell">
                  <StatusBadge status={a.status} />
                </td>
                <td className="tabular px-3 py-2 text-right align-top font-mono text-xs whitespace-nowrap text-muted">
                  {relativeTime(a.timestamp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
