import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Section } from "@/components/alerts/detail-panels";
import { getCase } from "@/db/queries";
import { relativeTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = await getCase(id);
  return { title: c ? c.title : "Case" };
}

export default async function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getCase(id);
  if (!c) notFound();

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3 md:px-6">
        <Link href="/cases" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
          <ArrowLeft size={13} /> Back to cases
        </Link>
        <h1 className="mt-2 text-base font-semibold text-foreground">{c.title}</h1>
        {c.summary && <p className="mt-1 max-w-2xl text-sm text-muted">{c.summary}</p>}
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
        <Section title={`Timeline · ${c.alerts.length} alert${c.alerts.length === 1 ? "" : "s"}`}>
          <ol className="space-y-2">
            {c.alerts.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/alerts/${a.id}`}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 transition-colors hover:border-border-strong"
                >
                  <SeverityBadge severity={a.severity} showLabel={false} />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{a.ruleDescription}</span>
                  <StatusBadge status={a.status} />
                  <span className="shrink-0 font-mono text-xs text-muted-2">{relativeTime(a.timestamp)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Section>

        {c.verdict && (
          <Section title="Verdict">
            <p className="text-sm text-foreground">{c.verdict}</p>
          </Section>
        )}
        {c.responseSteps && (
          <Section title="Response steps">
            <p className="whitespace-pre-line text-sm text-foreground">{c.responseSteps}</p>
          </Section>
        )}
        {c.lessonsLearned && (
          <Section title="Lessons learned">
            <p className="text-sm text-foreground">{c.lessonsLearned}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
