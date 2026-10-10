import { Counter } from "@/components/ui/counter";
import type { QueueStats } from "@/db/queries";
import { SEVERITIES } from "@/lib/severity";
import { SEVERITY_META } from "@/lib/ui/meta";

export function QueueStatsBar({ stats }: { stats: QueueStats }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
      <Tile label="Total alerts" value={stats.total} />
      <Tile label="New" value={stats.newCount} accent />
      {SEVERITIES.slice()
        .reverse()
        .slice(0, 4)
        .map((sev) => {
          const meta = SEVERITY_META[sev];
          return (
            <div key={sev} className="bg-surface px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <meta.icon size={13} style={{ color: meta.color }} />
                {meta.label}
              </div>
              <div className="tabular mt-1 text-xl font-semibold" style={{ color: meta.color }}>
                <Counter value={stats.bySeverity[sev] ?? 0} />
              </div>
            </div>
          );
        })}
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div
        className="tabular mt-1 text-xl font-semibold"
        style={accent ? { color: "var(--accent)" } : undefined}
      >
        <Counter value={value} />
      </div>
    </div>
  );
}
