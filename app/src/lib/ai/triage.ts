import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { aiAnalyses, type Alert } from "@/db/schema";

import { AI_MODEL, getAnthropic } from "./client";
import { PROMPT_VERSION, triageSystem, triageUserMessage } from "./prompts";
import { reserveAiCall } from "./rate-limit";
import { triageOutput, type TriageOutput } from "./schemas";

export interface CachedTriage {
  id: string;
  output: TriageOutput;
  model: string;
  accepted: number | null;
  createdAt: Date;
}

/** Read a cached triage for this alert + current prompt version, if any. */
export async function getCachedTriage(alertId: string): Promise<CachedTriage | null> {
  const rows = await db
    .select()
    .from(aiAnalyses)
    .where(
      and(
        eq(aiAnalyses.alertId, alertId),
        eq(aiAnalyses.feature, "triage"),
        eq(aiAnalyses.promptVersion, PROMPT_VERSION),
      ),
    )
    .orderBy(desc(aiAnalyses.createdAt))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const parsed = triageOutput.safeParse(row.output);
  if (!parsed.success) return null;
  return {
    id: row.id,
    output: parsed.data,
    model: row.model,
    accepted: row.accepted,
    createdAt: row.createdAt,
  };
}

export class RateLimitedError extends Error {
  constructor() {
    super("Daily AI call limit reached. Try again tomorrow.");
    this.name = "RateLimitedError";
  }
}

/**
 * Run a fresh triage: reserve a rate-limit slot, call the model, validate the
 * output against the strict schema, and cache it. The model output is treated as
 * data only; it is validated and stored, never executed.
 */
export async function runTriage(alert: Alert): Promise<CachedTriage> {
  if (!(await reserveAiCall())) throw new RateLimitedError();

  const client = getAnthropic();
  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2000,
    system: triageSystem(),
    messages: [
      {
        role: "user",
        content:
          triageUserMessage(alert) +
          "\n\nRespond with ONLY a single JSON object with exactly these keys: " +
          '"summary" (string), "verdict" (one of "likely_true_positive", ' +
          '"likely_false_positive", "unclear"), "confidence" (one of "low", "medium", ' +
          '"high"), "reasoning" (string), "attackTechniques" (array of strings), ' +
          '"nextChecks" (array of 1 to 5 short strings). No prose outside the JSON.',
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Strip a ```json fence if the model added one, then parse + validate.
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let candidate: unknown;
  try {
    candidate = JSON.parse(json);
  } catch {
    throw new Error("AI returned text that was not valid JSON");
  }
  const parsed = triageOutput.safeParse(candidate);
  if (!parsed.success) {
    throw new Error("AI output did not match the required schema");
  }

  const inserted = await db
    .insert(aiAnalyses)
    .values({
      alertId: alert.id,
      feature: "triage",
      promptVersion: PROMPT_VERSION,
      model: AI_MODEL,
      output: parsed.data,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    })
    .returning();

  const row = inserted[0]!;
  return {
    id: row.id,
    output: parsed.data,
    model: row.model,
    accepted: row.accepted,
    createdAt: row.createdAt,
  };
}

export async function setTriageAccepted(id: string, accepted: boolean): Promise<void> {
  await db
    .update(aiAnalyses)
    .set({ accepted: accepted ? 1 : 0 })
    .where(eq(aiAnalyses.id, id));
}
