import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import { COVERAGE, RESULT_META } from "@/content/coverage";
import { DETECTIONS } from "@/content/detections";
import { getAlert, getQueueStats, listAlerts } from "@/db/queries";

import { getAiAccuracy } from "./stats";

/**
 * Read-only tools the copilot may call. There are deliberately no write tools:
 * the copilot can advise, but only the analyst changes data. Each tool wraps an
 * existing query/content source, so the copilot sees exactly what the console
 * shows, already sanitised at ingest.
 *
 * Results are trimmed before being handed back to the model to keep token use
 * and attack surface small.
 */
export const COPILOT_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_alerts",
    description:
      "List alerts from the queue, newest first. Use for questions about what is in the queue, counts by type, or finding alerts by keyword, severity or status. Returns lightweight rows (no raw log).",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword to match in description, host or process." },
        severity: {
          type: "array",
          items: { type: "string", enum: ["low", "medium", "high", "critical"] },
          description: "Filter to these severities.",
        },
        status: {
          type: "array",
          items: {
            type: "string",
            enum: ["new", "in_progress", "true_positive", "false_positive", "escalated"],
          },
          description: "Filter to these statuses.",
        },
        limit: { type: "number", description: "Max rows (default 25, max 50)." },
      },
    },
  },
  {
    name: "get_alert",
    description:
      "Get the full detail of one alert by id: key fields, ATT&CK mapping, process tree and the raw event. Use when the analyst asks about a specific alert.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string", description: "The alert id (uuid)." } },
      required: ["id"],
    },
  },
  {
    name: "queue_stats",
    description:
      "Counts for the whole queue: total alerts, how many are new, and breakdowns by severity and status. Use for 'how many', 'what should I look at first' style questions.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "coverage_summary",
    description:
      "ATT&CK coverage from the lab: which techniques were tested, which the default Wazuh rules caught, which were missed, and which custom rules now cover. Use for questions about detection coverage or gaps.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_detections",
    description:
      "The custom Wazuh detection rules in the lab, with what each catches, its known false positives, and whether it was validated. Use for questions about the rules.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "ai_accuracy",
    description:
      "How often the AI triage call matched the analyst's final verdict, plus accept/reject counts. Use for questions about how good the AI has been.",
    input_schema: { type: "object", properties: {} },
  },
];

const clampLimit = (n: unknown): number => {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : 25;
  return Math.max(1, Math.min(50, v));
};

const asStringArray = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined;

/**
 * Execute one tool call. Unknown tools and bad arguments return a plain error
 * object (as data) rather than throwing, so the loop can keep going and the
 * model can recover.
 */
export async function runCopilotTool(
  name: string,
  input: Record<string, unknown>,
): Promise<{ result: unknown; summary: string }> {
  switch (name) {
    case "search_alerts": {
      const rows = await listAlerts(
        {
          search: typeof input.query === "string" ? input.query : undefined,
          severity: asStringArray(input.severity),
          status: asStringArray(input.status),
        },
        clampLimit(input.limit),
      );
      const trimmed = rows.map((r) => ({
        id: r.id,
        time: r.timestamp,
        host: r.agentName,
        rule: r.ruleId,
        level: r.ruleLevel,
        description: r.ruleDescription,
        severity: r.severity,
        attack: r.mitreIds,
        process: r.processName,
        status: r.status,
        sample: r.isSample === 1,
      }));
      return {
        result: { count: trimmed.length, alerts: trimmed },
        summary: `Searched alerts, found ${trimmed.length}`,
      };
    }

    case "get_alert": {
      const id = typeof input.id === "string" ? input.id : "";
      const a = await getAlert(id);
      if (!a) return { result: { error: "No alert with that id." }, summary: "Alert not found" };
      return {
        result: {
          id: a.id,
          time: a.timestamp,
          host: a.agentName,
          rule: { id: a.ruleId, level: a.ruleLevel, description: a.ruleDescription },
          severity: a.severity,
          attack: { ids: a.mitreIds, tactics: a.mitreTactics, techniques: a.mitreTechniques },
          process: a.processName,
          parentProcess: a.parentProcess,
          commandLine: a.commandLine,
          targetImage: a.targetImage,
          user: a.userName,
          status: a.status,
          analystNotes: a.analystNotes,
          rawEvent: a.rawLog,
        },
        summary: `Read alert ${a.ruleDescription}`,
      };
    }

    case "queue_stats": {
      const s = await getQueueStats();
      return { result: s, summary: "Read queue stats" };
    }

    case "coverage_summary": {
      const counts = COVERAGE.reduce<Record<string, number>>((acc, c) => {
        acc[c.result] = (acc[c.result] ?? 0) + 1;
        return acc;
      }, {});
      return {
        result: {
          totals: Object.fromEntries(
            Object.entries(counts).map(([k, v]) => [
              RESULT_META[k as keyof typeof RESULT_META]?.label ?? k,
              v,
            ]),
          ),
          techniques: COVERAGE.map((c) => ({
            attackId: c.attackId,
            technique: c.technique,
            tactic: c.tactic,
            result: RESULT_META[c.result].label,
            note: c.note,
          })),
        },
        summary: "Read ATT&CK coverage",
      };
    }

    case "list_detections": {
      return {
        result: DETECTIONS.map((d) => ({
          id: d.id,
          title: d.title,
          level: d.level,
          attackIds: d.attackIds,
          tactic: d.tactic,
          catches: d.catches,
          falsePositives: d.falsePositives,
          validated: d.validated,
        })),
        summary: "Read custom detection rules",
      };
    }

    case "ai_accuracy": {
      const acc = await getAiAccuracy();
      return { result: acc, summary: "Read AI accuracy" };
    }

    default:
      return { result: { error: `Unknown tool: ${name}` }, summary: `Unknown tool ${name}` };
  }
}
