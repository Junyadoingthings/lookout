"use server";

import { revalidatePath } from "next/cache";

import { getAlert } from "@/db/queries";
import { aiConfigured } from "@/lib/ai/client";
import { RateLimitedError, runTriage, setTriageAccepted, type CachedTriage } from "@/lib/ai/triage";
import type { SearchFilter } from "@/lib/ai/schemas";
import { requireAnalyst } from "@/lib/auth";

export type TriageActionResult = { ok: true; triage: CachedTriage } | { ok: false; error: string };

export async function runTriageAction(alertId: string): Promise<TriageActionResult> {
  await requireAnalyst();
  if (!aiConfigured()) {
    return { ok: false, error: "AI is not configured. Set ANTHROPIC_API_KEY." };
  }
  const alert = await getAlert(alertId);
  if (!alert) return { ok: false, error: "Alert not found" };

  try {
    const triage = await runTriage(alert);
    revalidatePath(`/alerts/${alertId}`);
    return { ok: true, triage };
  } catch (e) {
    if (e instanceof RateLimitedError) return { ok: false, error: e.message };
    return { ok: false, error: e instanceof Error ? e.message : "AI triage failed" };
  }
}

export async function setTriageVerdictAction(id: string, accepted: boolean, alertId: string) {
  await requireAnalyst();
  await setTriageAccepted(id, accepted);
  revalidatePath(`/alerts/${alertId}`);
}

export type SearchActionResult = { ok: true; filter: SearchFilter } | { ok: false; error: string };

export async function nlSearchAction(query: string): Promise<SearchActionResult> {
  await requireAnalyst();
  if (!aiConfigured()) return { ok: false, error: "AI is not configured." };
  if (!query.trim()) return { ok: false, error: "Enter a question." };
  try {
    const { translateSearch } = await import("@/lib/ai/search");
    const filter = await translateSearch(query);
    return { ok: true, filter };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Search failed" };
  }
}

export type ExplainActionResult =
  { ok: true; explanation: string; whyItMatters?: string } | { ok: false; error: string };

export async function explainFieldAction(
  field: string,
  value: string,
  ruleContext: string,
): Promise<ExplainActionResult> {
  await requireAnalyst();
  if (!aiConfigured()) return { ok: false, error: "AI is not configured." };
  try {
    const { explainField } = await import("@/lib/ai/explain");
    const out = await explainField(field, value, ruleContext);
    return out.whyItMatters
      ? { ok: true, explanation: out.explanation, whyItMatters: out.whyItMatters }
      : { ok: true, explanation: out.explanation };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Explain failed" };
  }
}
