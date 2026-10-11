import { Sparkles } from "lucide-react";

import type { AiAccuracy } from "@/lib/ai/stats";

/** Honest AI scorecard: how often the AI's call matched the final verdict. */
export function AiAccuracyCard({ stats }: { stats: AiAccuracy }) {
  if (stats.reviewed === 0 && stats.accepted === 0 && stats.rejected === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        <Sparkles size={13} className="text-accent" />
        AI accuracy
      </div>
      <Stat
        label="Matched final verdict"
        value={stats.accuracyPct === null ? "—" : `${stats.accuracyPct}%`}
        sub={`${stats.matched}/${stats.reviewed} reviewed`}
      />
      <Stat label="Accepted" value={String(stats.accepted)} />
      <Stat label="Rejected" value={String(stats.rejected)} />
      {stats.mismatched > 0 && <Stat label="AI was wrong" value={String(stats.mismatched)} warn />}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-2">{label}</div>
      <div
        className="tabular text-lg font-semibold"
        style={warn ? { color: "var(--sev-high)" } : undefined}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-2">{sub}</div>}
    </div>
  );
}
