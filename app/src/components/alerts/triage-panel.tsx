"use client";

import { Check, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { runTriageAction, setTriageVerdictAction } from "@/app/alerts/ai-actions";
import type { CachedTriage } from "@/lib/ai/triage";
import type { TriageVerdict } from "@/lib/ai/schemas";
import { cn, relativeTime } from "@/lib/utils";

const VERDICT_META: Record<TriageVerdict, { label: string; color: string }> = {
  likely_true_positive: { label: "Likely true positive", color: "var(--sev-high)" },
  likely_false_positive: { label: "Likely false positive", color: "var(--muted)" },
  unclear: { label: "Unclear", color: "var(--warn)" },
};

export function TriagePanel({
  alertId,
  initial,
  aiReady,
}: {
  alertId: string;
  initial: CachedTriage | null;
  aiReady: boolean;
}) {
  const [triage, setTriage] = useState<CachedTriage | null>(initial);
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      const res = await runTriageAction(alertId);
      if (res.ok) {
        setTriage(res.triage);
        toast.success("AI triage ready");
      } else {
        toast.error(res.error);
      }
    });

  const review = (accepted: boolean) => {
    if (!triage) return;
    start(async () => {
      await setTriageVerdictAction(triage.id, accepted, alertId);
      setTriage({ ...triage, accepted: accepted ? 1 : 0 });
      toast.success(accepted ? "AI assessment accepted" : "AI assessment rejected");
    });
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
          <Sparkles size={13} className="text-accent" />
          AI triage assist
        </h2>
        {triage && (
          <span className="text-[11px] text-muted-2">
            {triage.model} · {relativeTime(triage.createdAt)} ago
          </span>
        )}
      </div>

      <div className="p-3">
        {!triage ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Generate a plain-English assessment: likely verdict, reasoning, ATT&CK mapping, and
              the next checks an L1 analyst should make. You decide what to do with it.
            </p>
            <button
              type="button"
              onClick={run}
              disabled={!aiReady || pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
              title={aiReady ? undefined : "Available in analyst mode with an API key"}
            >
              <Sparkles size={14} />
              {pending ? "Analysing" : "Run AI triage"}
            </button>
            {!aiReady && (
              <p className="text-xs text-muted-2">
                Fresh analysis runs in analyst mode. The public demo shows cached results only.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-xs font-medium"
                style={{
                  color: VERDICT_META[triage.output.verdict].color,
                  backgroundColor: `color-mix(in srgb, ${VERDICT_META[triage.output.verdict].color} 14%, transparent)`,
                }}
              >
                {VERDICT_META[triage.output.verdict].label}
              </span>
              <span className="text-xs text-muted">confidence: {triage.output.confidence}</span>
              <span className="ml-auto rounded bg-accent-muted px-1.5 py-0.5 text-[10px] font-medium text-accent">
                AI-GENERATED
              </span>
            </div>

            <p className="text-sm text-foreground">{triage.output.summary}</p>

            <div>
              <h3 className="text-xs font-semibold text-muted">Reasoning</h3>
              <p className="mt-0.5 text-sm text-muted">{triage.output.reasoning}</p>
            </div>

            {triage.output.attackTechniques.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {triage.output.attackTechniques.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-muted">Next checks</h3>
              <ul className="mt-1 space-y-1">
                {triage.output.nextChecks.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted">Your call:</span>
              <button
                type="button"
                onClick={() => review(true)}
                disabled={pending}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50",
                  triage.accepted === 1
                    ? "border-transparent bg-ok/15 text-ok"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                <ThumbsUp size={12} /> Accept
              </button>
              <button
                type="button"
                onClick={() => review(false)}
                disabled={pending}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50",
                  triage.accepted === 0
                    ? "border-transparent bg-sev-critical/15 text-sev-critical"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                <ThumbsDown size={12} /> Reject
              </button>
              {aiReady && (
                <button
                  type="button"
                  onClick={run}
                  disabled={pending}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-muted-2 hover:text-foreground disabled:opacity-50"
                >
                  <X size={12} /> Re-run
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
