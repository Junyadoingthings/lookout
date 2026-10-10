import { z } from "zod";

import { SEVERITIES, severityFromRuleLevel } from "@/lib/severity";

/**
 * The shape of a raw Wazuh alert document from the indexer. Only the fields we
 * read are declared; `.passthrough()` keeps the rest so the full raw log is
 * preserved. Almost everything is optional because Wazuh events vary widely.
 */
const rawMitre = z
  .object({
    id: z.array(z.string()).optional(),
    tactic: z.array(z.string()).optional(),
    technique: z.array(z.string()).optional(),
  })
  .partial()
  .passthrough();

const rawRule = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    level: z.number().optional(),
    description: z.string().optional(),
    groups: z.array(z.string()).optional(),
    mitre: rawMitre.optional(),
  })
  .passthrough();

const rawAgent = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    ip: z.string().optional(),
  })
  .passthrough();

const rawEventdata = z
  .object({
    image: z.string().optional(),
    originalFileName: z.string().optional(),
    parentImage: z.string().optional(),
    commandLine: z.string().optional(),
    targetImage: z.string().optional(),
    user: z.string().optional(),
    targetUserName: z.string().optional(),
  })
  .passthrough();

export const rawWazuhAlert = z
  .object({
    // The indexer sets _id; some exports put id at top level.
    _id: z.string().optional(),
    id: z.string().optional(),
    timestamp: z.string(),
    rule: rawRule,
    agent: rawAgent.optional(),
    data: z
      .object({
        win: z
          .object({
            eventdata: rawEventdata.optional(),
            system: z.record(z.string(), z.unknown()).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type RawWazuhAlert = z.infer<typeof rawWazuhAlert>;

/**
 * The normalised alert the console works with. This is the contract between the
 * export pipeline and the database import, so it is validated strictly.
 */
export const parsedAlert = z.object({
  sourceId: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  agentName: z.string().min(1),
  agentId: z.string().min(1),
  ruleId: z.string().min(1),
  ruleLevel: z.number().int().min(0).max(15),
  ruleDescription: z.string().min(1),
  severity: z.enum(SEVERITIES),
  ruleGroups: z.array(z.string()),
  mitreIds: z.array(z.string()),
  mitreTactics: z.array(z.string()),
  mitreTechniques: z.array(z.string()),
  processName: z.string().nullable(),
  parentProcess: z.string().nullable(),
  commandLine: z.string().nullable(),
  targetImage: z.string().nullable(),
  userName: z.string().nullable(),
  rawLog: z.record(z.string(), z.unknown()),
});

export type ParsedAlert = z.infer<typeof parsedAlert>;

/** Last path segment of a Windows image path, e.g. C:\\...\\whoami.exe -> whoami.exe */
function baseName(image: string | undefined): string | null {
  if (!image) return null;
  const parts = image.split(/[\\/]/);
  const last = parts[parts.length - 1];
  return last && last.length > 0 ? last : null;
}

/**
 * Convert a raw Wazuh alert into the normalised shape. Throws (via zod) if the
 * input is missing fields we require, so a malformed export fails loudly instead
 * of writing junk to the database.
 */
export function parseAlert(input: unknown): ParsedAlert {
  const raw = rawWazuhAlert.parse(input);

  const sourceId = raw._id ?? raw.id;
  if (!sourceId) {
    throw new Error("Wazuh alert has no _id or id; cannot key it for import");
  }

  const ruleLevel = raw.rule.level ?? 0;
  const eventdata = raw.data?.win?.eventdata;

  const candidate: ParsedAlert = {
    sourceId,
    timestamp: raw.timestamp,
    agentName: raw.agent?.name ?? "unknown",
    agentId: raw.agent?.id ?? "unknown",
    ruleId: String(raw.rule.id ?? "0"),
    ruleLevel,
    ruleDescription: raw.rule.description ?? "(no description)",
    severity: severityFromRuleLevel(ruleLevel),
    ruleGroups: raw.rule.groups ?? [],
    mitreIds: raw.rule.mitre?.id ?? [],
    mitreTactics: raw.rule.mitre?.tactic ?? [],
    mitreTechniques: raw.rule.mitre?.technique ?? [],
    processName: baseName(eventdata?.originalFileName) ?? baseName(eventdata?.image),
    parentProcess: baseName(eventdata?.parentImage),
    commandLine: eventdata?.commandLine ?? null,
    targetImage: baseName(eventdata?.targetImage),
    userName: eventdata?.user ?? eventdata?.targetUserName ?? null,
    rawLog: raw as Record<string, unknown>,
  };

  return parsedAlert.parse(candidate);
}
