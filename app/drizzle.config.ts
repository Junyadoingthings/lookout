import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env.local on its own, so load it here (Node 22).
try {
  process.loadEnvFile(".env.local");
} catch {
  /* file may be absent in CI; env vars can come from the environment instead */
}

// Migrations prefer a direct (non-pooled) connection. Accept either the name we
// document or Supabase's default DIRECT_URL.
const url =
  process.env.DATABASE_URL_DIRECT ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: url ?? "" },
  verbose: true,
  strict: true,
});
