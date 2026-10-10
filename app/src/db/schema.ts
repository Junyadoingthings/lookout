import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { SEVERITIES } from "@/lib/severity";

/**
 * Alert lifecycle status, as an L1 analyst would move a ticket through it.
 */
export const alertStatus = pgEnum("alert_status", [
  "new",
  "in_progress",
  "true_positive",
  "false_positive",
  "escalated",
]);

export const severity = pgEnum("severity", SEVERITIES);

export const caseStatus = pgEnum("case_status", ["open", "closed"]);

/**
 * One detection from the lab, sanitised and ready to triage. The raw Wazuh
 * document lives in `rawLog` (also sanitised) so the detail page can show it.
 */
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The Wazuh indexer document id, so re-imports update instead of duplicate.
    sourceId: text("source_id").notNull().unique(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),

    agentName: text("agent_name").notNull(),
    agentId: text("agent_id").notNull(),

    ruleId: text("rule_id").notNull(),
    ruleLevel: integer("rule_level").notNull(),
    ruleDescription: text("rule_description").notNull(),
    severity: severity("severity").notNull(),
    ruleGroups: jsonb("rule_groups").$type<string[]>().notNull().default([]),

    // ATT&CK mapping, flattened for easy filtering.
    mitreIds: jsonb("mitre_ids").$type<string[]>().notNull().default([]),
    mitreTactics: jsonb("mitre_tactics").$type<string[]>().notNull().default([]),
    mitreTechniques: jsonb("mitre_techniques").$type<string[]>().notNull().default([]),

    // Parsed key fields from Sysmon/Windows, when present.
    processName: text("process_name"),
    parentProcess: text("parent_process"),
    commandLine: text("command_line"),
    targetImage: text("target_image"),
    userName: text("user_name"),

    rawLog: jsonb("raw_log").$type<Record<string, unknown>>().notNull(),

    // Analyst state. The AI never writes these directly.
    status: alertStatus("status").notNull().default("new"),
    analystNotes: text("analyst_notes"),

    caseId: uuid("case_id").references(() => cases.id, { onDelete: "set null" }),

    // True for seed/sample rows so the UI can label them and we can delete them
    // before launch. Real lab alerts are false.
    isSample: integer("is_sample").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("alerts_timestamp_idx").on(t.timestamp),
    index("alerts_severity_idx").on(t.severity),
    index("alerts_status_idx").on(t.status),
    index("alerts_case_idx").on(t.caseId),
  ],
);

/**
 * A group of related alerts treated as one incident.
 */
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  summary: text("summary"),
  status: caseStatus("status").notNull().default("open"),
  verdict: text("verdict"),
  responseSteps: text("response_steps"),
  lessonsLearned: text("lessons_learned"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  case: one(cases, { fields: [alerts.caseId], references: [cases.id] }),
}));

export const casesRelations = relations(cases, ({ many }) => ({
  alerts: many(alerts),
}));

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
