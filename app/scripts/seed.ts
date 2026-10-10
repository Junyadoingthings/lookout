/**
 * Seed the database with a handful of clearly-labelled SAMPLE alerts, built from
 * the test fixtures and sanitised. This lets the console render during
 * development before real lab data is loaded. Every row is marked isSample=1 so
 * the UI can badge it and so `npm run import` of real data is distinguishable.
 * Delete sample rows before launch with: npm run seed -- --clear
 */
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { alerts as alertsTable } from "@/db/schema";
import { sampleDiscoveryAlert, sampleLsassAlert } from "@/lib/wazuh/fixtures";
import { parseAlert } from "@/lib/wazuh/parse";
import { sanitizeBatch } from "@/lib/wazuh/sanitize";

async function main() {
  if (process.argv.includes("--clear")) {
    await db.delete(alertsTable).where(eq(alertsTable.isSample, 1));
    console.log("Cleared sample alerts.");
    process.exit(0);
  }

  const parsed = [sampleLsassAlert, sampleDiscoveryAlert].map(parseAlert);
  const { alerts } = sanitizeBatch(parsed);

  for (const a of alerts) {
    await db
      .insert(alertsTable)
      .values({
        sourceId: `sample-${a.sourceId}`,
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
        isSample: 1,
      })
      .onConflictDoNothing();
  }

  console.log(`Seeded ${alerts.length} sample alerts (isSample=1).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
