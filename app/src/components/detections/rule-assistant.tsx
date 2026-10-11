"use client";

import { Sparkles, Wrench } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { suggestFpTuningAction, suggestRuleAction } from "@/app/detections/actions";
import { CopyButton } from "@/components/ui/copy-button";
import type { FpTuningOutput, RuleSuggestOutput } from "@/lib/ai/schemas";

export function RuleAssistant({ aiReady }: { aiReady: boolean }) {
  const [desc, setDesc] = useState("");
  const [pending, start] = useTransition();
  const [rule, setRule] = useState<RuleSuggestOutput | null>(null);

  if (!aiReady) return null;

  const run = () =>
    start(async () => {
      const res = await suggestRuleAction(desc);
      if (res.ok) {
        setRule(res.rule);
        toast.success("Rule drafted. Untested until it fires in the lab.");
      } else toast.error(res.error);
    });

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles size={15} className="text-accent" /> Rule assistant
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Describe a technique or a behaviour the defaults missed. The AI drafts a Wazuh rule. It is
          untested until you confirm it fires in the lab.
        </p>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder='e.g. "detect rundll32 loading a DLL from a temp folder"'
            className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2.5 text-sm text-foreground placeholder:text-muted-2 focus:border-accent focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={run}
            disabled={pending || !desc.trim()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Drafting" : "Suggest rule"}
          </button>
        </div>

        {rule && (
          <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{rule.title}</h3>
              <span className="rounded bg-warn/15 px-1.5 py-0.5 text-[10px] font-medium text-warn">
                UNTESTED · AI-GENERATED
              </span>
            </div>
            <p className="text-sm text-muted">{rule.explanation}</p>
            <div className="rounded border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-2 py-1">
                <span className="text-xs text-muted">Suggested XML</span>
                <CopyButton value={rule.ruleXml} label="Copy rule" />
              </div>
              <pre className="overflow-x-auto p-2.5 font-mono text-[11px] text-foreground">
                {rule.ruleXml}
              </pre>
            </div>
            <p className="text-xs text-muted">
              <span className="font-medium text-muted-2">Known false positives:</span>{" "}
              {rule.falsePositives}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function FpTuning({
  ruleId,
  ruleDescription,
  fpCount,
  aiReady,
}: {
  ruleId: string;
  ruleDescription: string;
  fpCount: number;
  aiReady: boolean;
}) {
  const [pending, start] = useTransition();
  const [tuning, setTuning] = useState<FpTuningOutput | null>(null);

  if (!aiReady || fpCount === 0) return null;

  const run = () =>
    start(async () => {
      const res = await suggestFpTuningAction(ruleId, ruleDescription);
      if (res.ok) setTuning(res.tuning);
      else toast.error(res.error);
    });

  return (
    <div className="mt-3 rounded-md border border-warn/40 bg-warn/5 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Wrench size={13} className="text-warn" />
        <span className="text-xs text-muted">
          {fpCount} false positive{fpCount === 1 ? "" : "s"} recorded for this rule.
        </span>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="ml-auto rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground disabled:opacity-50"
        >
          {pending ? "Thinking" : "Suggest tuning"}
        </button>
      </div>
      {tuning && (
        <div className="mt-2 space-y-1.5 text-sm">
          <p className="text-foreground">{tuning.suggestion}</p>
          {tuning.xmlChange && (
            <pre className="overflow-x-auto rounded bg-surface p-2 font-mono text-[11px] text-foreground">
              {tuning.xmlChange}
            </pre>
          )}
          <p className="text-xs text-muted">
            <span className="font-medium text-muted-2">Trade-off:</span> {tuning.tradeoff}
          </p>
        </div>
      )}
    </div>
  );
}
