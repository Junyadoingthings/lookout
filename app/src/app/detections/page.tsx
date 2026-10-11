import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { FpTuning, RuleAssistant } from "@/components/detections/rule-assistant";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page";
import { Reveal } from "@/components/ui/reveal";
import { DETECTIONS } from "@/content/detections";
import { getFpSummary } from "@/db/queries";
import { aiConfigured } from "@/lib/ai/client";
import { isAnalyst } from "@/lib/auth";
import { SEVERITY_META } from "@/lib/ui/meta";
import { severityFromRuleLevel } from "@/lib/severity";

export const metadata: Metadata = { title: "Detections" };

export default async function DetectionsPage() {
  const [analyst, fpSummary] = await Promise.all([isAnalyst(), getFpSummary()]);
  const aiReady = analyst && aiConfigured();

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Detections"
        description="The custom Wazuh rules I wrote for the gaps Phase 2 found. Each one lists what it catches and a known false positive."
        icon={ShieldCheck}
      />
      <div className="space-y-4 p-4 md:p-6">
        <RuleAssistant aiReady={aiReady} />
        {DETECTIONS.map((d, i) => {
          const sev = severityFromRuleLevel(d.level);
          const meta = SEVERITY_META[sev];
          return (
            <Reveal key={d.id} delay={0.04 * i}>
              <section className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <meta.icon size={18} style={{ color: meta.color }} className="mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{d.title}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-mono">#{d.id}</span>
                        <span>level {d.level}</span>
                        <span>{d.tactic}</span>
                        {d.attackIds.map((a) => (
                          <a
                            key={a}
                            href={`https://attack.mitre.org/techniques/${a.replace(".", "/")}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-border bg-surface-2 px-1 py-0.5 font-mono text-[10px] text-accent"
                          >
                            {a}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                    style={
                      d.validated
                        ? {
                            color: "var(--ok)",
                            backgroundColor: "color-mix(in srgb, var(--ok) 14%, transparent)",
                          }
                        : { color: "var(--muted)", backgroundColor: "var(--surface-2)" }
                    }
                  >
                    {d.validated ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {d.validated ? "Validated in lab" : "Untested"}
                  </span>
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                        Catches
                      </h3>
                      <p className="mt-1 text-sm text-foreground">{d.catches}</p>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-1 text-xs font-semibold tracking-wide text-muted uppercase">
                        <AlertTriangle size={12} /> Known false positives
                      </h3>
                      <p className="mt-1 text-sm text-muted">{d.falsePositives}</p>
                    </div>
                    {d.example && (
                      <div>
                        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                          Example it fired on
                        </h3>
                        <code className="mt-1 block rounded bg-surface-2 p-2 font-mono text-xs break-all text-foreground">
                          {d.example}
                        </code>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-surface-2">
                    <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                      <span className="text-xs font-medium text-muted">Rule XML</span>
                      <CopyButton value={d.xml} label="Copy rule" />
                    </div>
                    <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-foreground">
                      {d.xml}
                    </pre>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <FpTuning
                    ruleId={d.id}
                    ruleDescription={d.title}
                    fpCount={fpSummary[d.id]?.count ?? 0}
                    aiReady={aiReady}
                  />
                </div>
              </section>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
