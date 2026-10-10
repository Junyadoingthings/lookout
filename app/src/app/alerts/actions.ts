"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { alerts } from "@/db/schema";
import { requireAnalyst } from "@/lib/auth";

const VALID = ["new", "in_progress", "true_positive", "false_positive", "escalated"] as const;
type Status = (typeof VALID)[number];

export async function setAlertStatus(id: string, status: string) {
  await requireAnalyst();
  if (!VALID.includes(status as Status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  await db
    .update(alerts)
    .set({ status: status as Status, updatedAt: new Date() })
    .where(eq(alerts.id, id));
  revalidatePath("/alerts");
  revalidatePath(`/alerts/${id}`);
}

export async function saveAlertNotes(id: string, notes: string) {
  await requireAnalyst();
  await db
    .update(alerts)
    .set({ analystNotes: notes.slice(0, 5000), updatedAt: new Date() })
    .where(eq(alerts.id, id));
  revalidatePath(`/alerts/${id}`);
}
