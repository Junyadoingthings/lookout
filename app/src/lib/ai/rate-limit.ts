import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { aiUsage } from "@/db/schema";

import { MAX_CALLS_PER_DAY } from "./client";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically reserve one fresh-AI call for today. Returns false when the daily
 * cap is reached. A DB counter is used (not an in-memory one) because serverless
 * instances do not share memory. The UPSERT increments and the WHERE guards the
 * cap in a single statement, so concurrent requests cannot overshoot.
 */
export async function reserveAiCall(): Promise<boolean> {
  const day = today();
  const rows = await db
    .insert(aiUsage)
    .values({ day, calls: 1 })
    .onConflictDoUpdate({
      target: aiUsage.day,
      set: { calls: sql`${aiUsage.calls} + 1` },
      setWhere: sql`${aiUsage.calls} < ${MAX_CALLS_PER_DAY}`,
    })
    .returning({ calls: aiUsage.calls });

  // No row returned means the guarded update did not apply: cap reached.
  return rows.length > 0;
}

export async function callsToday(): Promise<number> {
  const rows = await db
    .select({ calls: aiUsage.calls })
    .from(aiUsage)
    .where(sql`${aiUsage.day} = ${today()}`)
    .limit(1);
  return rows[0]?.calls ?? 0;
}
