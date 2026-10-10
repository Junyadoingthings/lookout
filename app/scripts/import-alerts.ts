/**
 * Load sanitised alerts into Postgres. Idempotent: re-running updates existing
 * rows (keyed on sourceId) instead of duplicating.
 *
 * Run (from app/):
 *   npm run import           # imports lab/export/alerts.sanitized.json
 *   npm run import -- --sample  # marks rows as sample data
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { db } from "@/db/client";
import { alerts as alertsTable } from "@/db/schema";
import { parsedAlert, type ParsedAlert } from "@/lib/wazuh/parse";

const here = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(here, "../../lab/export/alerts.sanitized.json");

async function main() {
  const isSample = process.argv.includes("--sample");
  const rows = JSON.parse(await readFile(INPUT, "utf8")) as unknown[];
  const alerts: ParsedAlert[] = rows.map((r) => parsedAlert.parse(r));
  console.log(`Loaded ${alerts.length} alerts from ${INPUT}${isSample ? " (sample)" : ""}`);

  let imported = 0;
  for (const a of alerts) {
    await db
      .insert(alertsTable)
      .values({
        sourceId: a.sourceId,
        timestamp: new Date(a.timestamp),
        agentName: a.agentName,
        agentId: a.agentId,
        ruleId: a.ruleId,
        ruleLevel: a.ruleLevel,
        ruleDescription: a.ruleDescription,
        severity: a.severity,
        ruleGroups: a.ruleGroups,
        mitreIds: a.mitreIds,
        mitreTactics: a.mitreTactics,
        mitreTechniques: a.mitreTechniques,
        processName: a.processName,
        parentProcess: a.parentProcess,
        commandLine: a.commandLine,
        targetImage: a.targetImage,
        userName: a.userName,
        rawLog: a.rawLog,
        isSample: isSample ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: alertsTable.sourceId,
        set: {
          ruleDescription: a.ruleDescription,
          severity: a.severity,
          ruleLevel: a.ruleLevel,
          rawLog: a.rawLog,
          updatedAt: new Date(),
        },
      });
    imported += 1;
  }

  console.log(`Imported/updated ${imported} alerts.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
