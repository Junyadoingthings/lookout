import "server-only";

import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { aiAnalyses, alerts } from "@/db/schema";

import type { TriageOutput } from "./schemas";

export interface AiAccuracy {
  reviewed: number; // triages where the analyst reached a final TP/FP verdict
  matched: number; // AI's call matched the analyst's final verdict
  mismatched: number;
  accuracyPct: number | null;
  accepted: number; // analyst accepted the AI assessment
  rejected: number;
}

/**
 * How often the AI's true/false-positive call matched the analyst's final
 * verdict. Only alerts the analyst actually closed as TP or FP count. Mismatches
 * are surfaced on purpose: honesty about when the AI was wrong is the point.
 */
export async function getAiAccuracy(): Promise<AiAccuracy> {
  const rows = await db
    .select({
      output: aiAnalyses.output,
      accepted: aiAnalyses.accepted,
      status: alerts.status,
    })
    .from(aiAnalyses)
    .innerJoin(alerts, eq(aiAnalyses.alertId, alerts.id))
    .where(and(eq(aiAnalyses.feature, "triage"), isNotNull(aiAnalyses.alertId)));

  let reviewed = 0;
  let matched = 0;
  let accepted = 0;
  let rejected = 0;

  for (const r of rows) {
    if (r.accepted === 1) accepted += 1;
    if (r.accepted === 0) rejected += 1;

    const verdict = (r.output as TriageOutput | null)?.verdict;
    const predicted =
      verdict === "likely_true_positive"
        ? "true_positive"
        : verdict === "likely_false_positive"
          ? "false_positive"
          : null;
    const isFinal = r.status === "true_positive" || r.status === "false_positive";
    if (predicted && isFinal) {
      reviewed += 1;
      if (predicted === r.status) matched += 1;
    }
  }

  return {
    reviewed,
    matched,
    mismatched: reviewed - matched,
    accuracyPct: reviewed > 0 ? Math.round((matched / reviewed) * 100) : null,
    accepted,
    rejected,
  };
}
