import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AttackMapping,
  CommandLine,
  HowToRead,
  KeyFields,
  ProcessTree,
  Section,
} from "@/components/alerts/detail-panels";
import { DetailSplit } from "@/components/alerts/detail-split";
import { JsonViewer } from "@/components/alerts/json-viewer";
import { NotesEditor } from "@/components/alerts/notes-editor";
import { TriagePanel } from "@/components/alerts/triage-panel";
import { VerdictBar } from "@/components/alerts/verdict-bar";
import { SeverityBadge } from "@/components/ui/badge";
import { getAlert } from "@/db/queries";
import { aiConfigured } from "@/lib/ai/client";
import { getCachedTriage } from "@/lib/ai/triage";
import { isAnalyst } from "@/lib/auth";
import { formatTimestamp } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const alert = await getAlert(id);
  return { title: alert ? alert.ruleDescription.slice(0, 60) : "Alert" };
}

export default async function AlertDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const alert = await getAlert(id);
  if (!alert) notFound();

  const [cachedTriage, analyst] = await Promise.all([getCachedTriage(id), isAnalyst()]);
  const aiReady = analyst && aiConfigured();

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3 md:px-6">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} /> Back to queue
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <SeverityBadge severity={alert.severity} showLabel={false} className="mt-0.5" />
            <div>
              <h1 className="text-base leading-snug font-semibold text-foreground">
                {alert.ruleDescription}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
                <span>#{alert.ruleId}</span>
                <span>{alert.agentName}</span>
                <span>{formatTimestamp(alert.timestamp)}</span>
                {alert.isSample === 1 && (
                  <span className="rounded bg-warn/15 px-1 font-sans text-[10px] font-medium text-warn">
                    SAMPLE DATA
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <VerdictBar id={alert.id} status={alert.status} />
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        <HowToRead />
        <DetailSplit
          left={
            <div className="space-y-4">
              <TriagePanel alertId={alert.id} initial={cachedTriage} aiReady={aiReady} />
              <Section title="Key fields">
                <KeyFields alert={alert} />
              </Section>
              <ProcessTree alert={alert} />
              <CommandLine alert={alert} aiReady={aiReady} />
              <AttackMapping alert={alert} />
              <Section title="Analyst notes">
                <NotesEditor id={alert.id} initial={alert.analystNotes} />
              </Section>
            </div>
          }
          right={<JsonViewer data={alert.rawLog} />}
        />
      </div>
    </div>
  );
}
