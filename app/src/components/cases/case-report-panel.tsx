"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { draftCaseReportAction, saveCaseAction } from "@/app/cases/actions";

interface Fields {
  summary: string;
  verdict: string;
  responseSteps: string;
  lessonsLearned: string;
}

/**
 * AI case-report drafting. Generates a first draft the analyst edits, then saves.
 * The draft is a starting point, clearly labelled; nothing is published without
 * the analyst saving it.
 */
export function CaseReportPanel({ caseId, aiReady }: { caseId: string; aiReady: boolean }) {
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Fields | null>(null);

  if (!aiReady) return null;

  const run = () =>
    start(async () => {
      const res = await draftCaseReportAction(caseId);
      if (res.ok) {
        setDraft(res.draft);
        toast.success("Draft ready. Edit, then save.");
      } else toast.error(res.error);
    });

  const save = () => {
    if (!draft) return;
    start(async () => {
      await saveCaseAction(caseId, draft);
      toast.success("Case report saved");
      setDraft(null);
    });
  };

  const field = (key: keyof Fields, label: string, rows = 3) => (
    <div>
      <label className="text-xs font-semibold text-muted">{label}</label>
      <textarea
        value={draft![key]}
        onChange={(e) => setDraft({ ...draft!, [key]: e.target.value })}
        rows={rows}
        className="mt-1 w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus-visible:outline-none"
      />
    </div>
  );

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
          <Sparkles size={13} className="text-accent" /> AI report draft
        </h2>
        {draft && (
          <span className="rounded bg-accent-muted px-1.5 py-0.5 text-[10px] font-medium text-accent">
            AI-GENERATED DRAFT
          </span>
        )}
      </div>
      <div className="space-y-3 p-3">
        {!draft ? (
          <>
            <p className="text-sm text-muted">
              Draft a first-pass incident report from this case&apos;s alerts. You edit it before it
              is saved.
            </p>
            <button
              type="button"
              onClick={run}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles size={14} /> {pending ? "Drafting" : "Draft with AI"}
            </button>
          </>
        ) : (
          <>
            {field("summary", "Summary", 4)}
            {field("verdict", "Verdict")}
            {field("responseSteps", "Response steps", 4)}
            {field("lessonsLearned", "Lessons learned")}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Saving" : "Save report"}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="text-xs text-muted-2 hover:text-foreground"
              >
                Discard
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
