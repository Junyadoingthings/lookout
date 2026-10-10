import "server-only";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "./client";
import { alerts, cases, type Alert } from "./schema";

export interface AlertFilters {
  severity?: string[];
  status?: string[];
  tactic?: string[];
  search?: string;
}

/** Lightweight row for the queue table (no heavy rawLog). */
export type AlertListItem = Pick<
  Alert,
  | "id"
  | "timestamp"
  | "agentName"
  | "ruleId"
  | "ruleLevel"
  | "ruleDescription"
  | "severity"
  | "mitreIds"
  | "mitreTactics"
  | "processName"
  | "status"
  | "isSample"
>;

const listColumns = {
  id: alerts.id,
  timestamp: alerts.timestamp,
  agentName: alerts.agentName,
  ruleId: alerts.ruleId,
  ruleLevel: alerts.ruleLevel,
  ruleDescription: alerts.ruleDescription,
  severity: alerts.severity,
  mitreIds: alerts.mitreIds,
  mitreTactics: alerts.mitreTactics,
  processName: alerts.processName,
  status: alerts.status,
  isSample: alerts.isSample,
} as const;

/** The alert queue, newest first, with optional filters. */
export async function listAlerts(
  filters: AlertFilters = {},
  limit = 200,
): Promise<AlertListItem[]> {
  const conditions = [];
  if (filters.severity?.length) {
    conditions.push(
      inArray(alerts.severity, filters.severity as (typeof alerts.severity.enumValues)[number][]),
    );
  }
  if (filters.status?.length) {
    conditions.push(
      inArray(alerts.status, filters.status as (typeof alerts.status.enumValues)[number][]),
    );
  }
  if (filters.tactic?.length) {
    // mitreTactics is a jsonb array; match if it overlaps the requested tactics.
    conditions.push(
      sql`${alerts.mitreTactics} ?| ${sql.raw(`array[${filters.tactic.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")}]`)}`,
    );
  }
  if (filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      sql`(${alerts.ruleDescription} ILIKE ${q} OR ${alerts.agentName} ILIKE ${q} OR ${alerts.processName} ILIKE ${q} OR ${alerts.commandLine} ILIKE ${q})`,
    );
  }

  return db
    .select(listColumns)
    .from(alerts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(alerts.timestamp))
    .limit(limit);
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  const rows = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  return rows[0];
}

export interface QueueStats {
  total: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  newCount: number;
}

export async function getQueueStats(): Promise<QueueStats> {
  const sevRows = await db
    .select({ severity: alerts.severity, n: count() })
    .from(alerts)
    .groupBy(alerts.severity);
  const statusRows = await db
    .select({ status: alerts.status, n: count() })
    .from(alerts)
    .groupBy(alerts.status);

  const bySeverity: Record<string, number> = {};
  let total = 0;
  for (const r of sevRows) {
    bySeverity[r.severity] = r.n;
    total += r.n;
  }
  const byStatus: Record<string, number> = {};
  for (const r of statusRows) byStatus[r.status] = r.n;

  return { total, bySeverity, byStatus, newCount: byStatus["new"] ?? 0 };
}

/** Whether any rows are sample/seed data, so the UI can show a banner. */
export async function hasSampleData(): Promise<boolean> {
  const rows = await db.select({ n: count() }).from(alerts).where(eq(alerts.isSample, 1)).limit(1);
  return (rows[0]?.n ?? 0) > 0;
}

export async function listCases() {
  const rows = await db.select().from(cases).orderBy(desc(cases.updatedAt));
  const withCounts = await Promise.all(
    rows.map(async (c) => {
      const counted = await db
        .select({ n: count() })
        .from(alerts)
        .where(eq(alerts.caseId, c.id));
      return { ...c, alertCount: counted[0]?.n ?? 0 };
    }),
  );
  return withCounts;
}

export async function getCase(id: string) {
  const rows = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  const theCase = rows[0];
  if (!theCase) return undefined;
  const linked = await db
    .select(listColumns)
    .from(alerts)
    .where(eq(alerts.caseId, id))
    .orderBy(alerts.timestamp);
  return { ...theCase, alerts: linked };
}
