"use server";

import { getFpSummary } from "@/db/queries";
import { aiConfigured } from "@/lib/ai/client";
import type { FpTuningOutput, RuleSuggestOutput } from "@/lib/ai/schemas";
import { requireAnalyst } from "@/lib/auth";

export type RuleResult = { ok: true; rule: RuleSuggestOutput } | { ok: false; error: string };

export async function suggestRuleAction(description: string): Promise<RuleResult> {
  await requireAnalyst();
  if (!aiConfigured()) return { ok: false, error: "AI is not configured." };
  if (!description.trim()) return { ok: false, error: "Describe a technique first." };
  try {
    const { suggestRule } = await import("@/lib/ai/rule-tools");
    const rule = await suggestRule(description);
    return { ok: true, rule };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Suggestion failed" };
  }
}

export type TuningResult = { ok: true; tuning: FpTuningOutput } | { ok: false; error: string };

export async function suggestFpTuningAction(
  ruleId: string,
  ruleDescription: string,
): Promise<TuningResult> {
  await requireAnalyst();
  if (!aiConfigured()) return { ok: false, error: "AI is not configured." };
  const fp = await getFpSummary();
  const entry = fp[ruleId];
  if (!entry || entry.count === 0) {
    return { ok: false, error: "No false positives recorded for this rule yet." };
  }
  try {
    const { suggestFpTuning } = await import("@/lib/ai/rule-tools");
    const tuning = await suggestFpTuning(ruleId, ruleDescription, entry.samples);
    return { ok: true, tuning };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Tuning failed" };
  }
}
