/**
 * Seed the database with a handful of clearly-labelled SAMPLE alerts, built from
 * the test fixtures and sanitised. This lets the console render during
 * development before real lab data is loaded. Every row is marked isSample=1 so
 * the UI can badge it and so `npm run import` of real data is distinguishable.
 * Delete sample rows before launch with: npm run seed -- --clear
 */
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { alerts as alertsTable, cases as casesTable } from "@/db/schema";
import { sampleDiscoveryAlert, sampleLsassAlert } from "@/lib/wazuh/fixtures";
import { parseAlert } from "@/lib/wazuh/parse";
import { sanitizeBatch } from "@/lib/wazuh/sanitize";

async function main() {
  if (process.argv.includes("--clear")) {
    await db.delete(alertsTable).where(eq(alertsTable.isSample, 1));
    await db.delete(casesTable).where(eq(casesTable.title, "[Sample] Credential access attempt on WORKSTATION-01"));
    console.log("Cleared sample alerts and case.");
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

  // A sample incident grouping both alerts, so the Cases page is not empty.
  const title = "[Sample] Credential access attempt on WORKSTATION-01";
  const existing = await db.select().from(casesTable).where(eq(casesTable.title, title)).limit(1);
  const caseId =
    existing[0]?.id ??
    (
      await db
        .insert(casesTable)
        .values({
          title,
          status: "closed",
          summary:
            "Recon followed by an LSASS memory access on WORKSTATION-01. Sample data for the demo.",
          verdict:
            "True positive (simulated). The discovery and the LSASS access are consistent with a credential-theft attempt staged with Atomic Red Team.",
          responseSteps:
            "1. Isolate the host. 2. Reset credentials cached on it. 3. Hunt for the source process reading LSASS. 4. Confirm no dump file was exfiltrated.",
          lessonsLearned:
            "The LSASS access produced no telemetry until Sysmon ProcessAccess logging was enabled. Collection gaps hide the most serious techniques.",
        })
        .returning({ id: casesTable.id })
    )[0]!.id;

  await db
    .update(alertsTable)
    .set({ caseId })
    .where(inArray(alertsTable.sourceId, alerts.map((a) => `sample-${a.sourceId}`)));

  console.log(`Seeded ${alerts.length} sample alerts and 1 sample case (isSample=1).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
