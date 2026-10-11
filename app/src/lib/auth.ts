import "server-only";

import { cookies } from "next/headers";

/**
 * Analyst gate. The public demo is read-only; writes (verdicts, notes, fresh AI)
 * require analyst mode. Full Supabase email auth is wired in a later step; for
 * now analyst mode is on in local development and off in production until that
 * lands, so the deployed demo can never be mutated by a visitor.
 */
export async function isAnalyst(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const store = await cookies();
  return store.get("lookout_analyst")?.value === "1";
}

export async function requireAnalyst(): Promise<void> {
  if (!(await isAnalyst())) {
    throw new Error("Analyst mode required. The public demo is read-only.");
  }
}
