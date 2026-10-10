"use server";

import { revalidatePath } from "next/cache";

import { getAlert } from "@/db/queries";
import { aiConfigured } from "@/lib/ai/client";
import { RateLimitedError, runTriage, setTriageAccepted, type CachedTriage } from "@/lib/ai/triage";
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
