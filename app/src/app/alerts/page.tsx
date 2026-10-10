import { Inbox, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AlertTable } from "@/components/alerts/alert-table";
import { FilterBar } from "@/components/alerts/filter-bar";
import { QueueSkeleton } from "@/components/alerts/queue-skeleton";
import { QueueStatsBar } from "@/components/alerts/queue-stats";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { getQueueStats, listAlerts, type AlertFilters } from "@/db/queries";

export const metadata: Metadata = { title: "Alerts" };

function toArray(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  const s = Array.isArray(v) ? v.join(",") : v;
  return s.split(",").filter(Boolean);
}

async function QueueData({ filters }: { filters: AlertFilters }) {
  const [alerts, stats] = await Promise.all([listAlerts(filters), getQueueStats()]);
  const filtered = Boolean(filters.severity || filters.status || filters.search);

  return (
    <>
      <QueueStatsBar stats={stats} />
      <FilterBar />
      {alerts.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Inbox}
            title={filtered ? "No alerts match these filters" : "No alerts yet"}
            description={
              filtered
                ? "Try clearing a filter, or widen the search."
                : "Run the export from the lab to load real detections, or seed sample data."
            }
          />
        </div>
      ) : (
        <>
          <AlertTable alerts={alerts} />
          <p className="text-xs text-muted-2">
            Showing {alerts.length} alert{alerts.length === 1 ? "" : "s"}
            {filtered ? " (filtered)" : ""}.
          </p>
        </>
      )}
    </>
  );
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters: AlertFilters = {
    severity: toArray(sp.sev),
    status: toArray(sp.status),
    search: typeof sp.q === "string" ? sp.q : undefined,
  };
  const key = JSON.stringify(filters);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Alerts"
        description="Detections from the lab. Triage with j/k to move, enter to open, t/f/e to set a verdict."
        icon={ShieldAlert}
      />
      <div className="space-y-4 p-4 md:p-6">
        <Suspense key={key} fallback={<QueueSkeleton />}>
          <QueueData filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
