import { z } from "zod";

/**
 * Strict schemas for every AI output. Model responses are validated against
 * these before anything is stored or shown. If a response does not match, it is
 * rejected, not "fixed up". This is a core prompt-injection defence: the model
 * can only ever produce data in these shapes, and nothing it returns triggers an
 * action by itself.
 */

export const triageVerdict = z.enum(["likely_true_positive", "likely_false_positive", "unclear"]);
export type TriageVerdict = z.infer<typeof triageVerdict>;

export const triageOutput = z.object({
  summary: z.string().min(1).max(1200),
  verdict: triageVerdict,
  confidence: z.enum(["low", "medium", "high"]),
  reasoning: z.string().min(1).max(1500),
  attackTechniques: z.array(z.string().max(40)).max(8),
  nextChecks: z.array(z.string().min(1).max(300)).min(1).max(5),
});
export type TriageOutput = z.infer<typeof triageOutput>;

/** "Explain this field" output. */
export const explainOutput = z.object({
  field: z.string().max(120),
  explanation: z.string().min(1).max(1200),
  whyItMatters: z.string().max(800).optional(),
});
export type ExplainOutput = z.infer<typeof explainOutput>;

/** Natural-language search translated to a structured filter (never raw SQL). */
export const searchFilter = z.object({
  severity: z
    .array(z.enum(["info", "low", "medium", "high", "critical"]))
    .max(5)
    .optional(),
  status: z
    .array(z.enum(["new", "in_progress", "true_positive", "false_positive", "escalated"]))
    .max(5)
    .optional(),
  text: z.string().max(200).optional(),
  explanation: z.string().max(400),
});
export type SearchFilter = z.infer<typeof searchFilter>;

/** First-draft incident report fields the analyst edits before publishing. */
export const caseReportOutput = z.object({
  summary: z.string().min(1).max(1500),
  verdict: z.string().min(1).max(1000),
  responseSteps: z.string().min(1).max(1500),
  lessonsLearned: z.string().min(1).max(1000),
});
export type CaseReportOutput = z.infer<typeof caseReportOutput>;

/** JSON Schema for the Messages API output_config.format, kept in sync by hand. */
export const TRIAGE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    verdict: {
      type: "string",
      enum: ["likely_true_positive", "likely_false_positive", "unclear"],
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    reasoning: { type: "string" },
    attackTechniques: { type: "array", items: { type: "string" } },
    nextChecks: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "verdict", "confidence", "reasoning", "attackTechniques", "nextChecks"],
} as const;
