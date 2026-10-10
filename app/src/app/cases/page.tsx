import { FileSearch, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState, PageHeader } from "@/components/ui/page";
import { listCases } from "@/db/queries";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Cases" };

async function CaseList() {
  const cases = await listCases();
  if (cases.length === 0) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={FolderOpen}
          title="No cases yet"
          description="Group related alerts into an incident to build a case."
        />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <Link
          key={c.id}
          href={`/cases/${c.id}`}
          className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-foreground">{c.title}</h2>
              {c.summary && <p className="mt-1 line-clamp-1 text-sm text-muted">{c.summary}</p>}
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
              style={
                c.status === "open"
                  ? { color: "var(--accent)", backgroundColor: "var(--accent-muted)" }
                  : { color: "var(--muted)", backgroundColor: "var(--surface-2)" }
              }
            >
              {c.status === "open" ? "Open" : "Closed"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-2">
            <span>
              {c.alertCount} alert{c.alertCount === 1 ? "" : "s"}
            </span>
            <span>updated {relativeTime(c.updatedAt)} ago</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function CasesPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Cases"
        description="Related alerts grouped into incidents, each with a verdict, response steps, and lessons learned."
        icon={FileSearch}
      />
      <div className="p-4 md:p-6">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-surface-2" />}>
          <CaseList />
        </Suspense>
      </div>
    </div>
  );
}
