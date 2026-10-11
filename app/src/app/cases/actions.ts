"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { cases } from "@/db/schema";
import { getCase } from "@/db/queries";
import { aiConfigured } from "@/lib/ai/client";
import type { CaseReportOutput } from "@/lib/ai/schemas";
import { requireAnalyst } from "@/lib/auth";

export type DraftResult = { ok: true; draft: CaseReportOutput } | { ok: false; error: string };

export async function draftCaseReportAction(caseId: string): Promise<DraftResult> {
  await requireAnalyst();
  if (!aiConfigured()) return { ok: false, error: "AI is not configured." };
  const c = await getCase(caseId);
  if (!c) return { ok: false, error: "Case not found" };
  try {
    const { draftCaseReport } = await import("@/lib/ai/case-report");
    const draft = await draftCaseReport(c, c.alerts);
    return { ok: true, draft };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Draft failed" };
  }
}

export async function saveCaseAction(
  caseId: string,
  fields: { summary: string; verdict: string; responseSteps: string; lessonsLearned: string },
) {
  await requireAnalyst();
  await db
    .update(cases)
    .set({
      summary: fields.summary.slice(0, 4000),
      verdict: fields.verdict.slice(0, 4000),
      responseSteps: fields.responseSteps.slice(0, 4000),
      lessonsLearned: fields.lessonsLearned.slice(0, 4000),
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId));
  revalidatePath(`/cases/${caseId}`);
}
