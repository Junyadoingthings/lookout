import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Database client, initialised lazily on first use. We do NOT connect or throw
 * at module import, so a build that never runs a query (Next collecting page
 * data for dynamic routes) succeeds even when DATABASE_URL is absent. The error
 * surfaces only when a query actually runs, by which point the runtime env is
 * set.
 */
type DB = PostgresJsDatabase<typeof schema>;

let instance: DB | null = null;

function init(): DB {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(connectionString, { prepare: false });
  instance = drizzle(client, { schema });
  return instance;
}

export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = instance ?? init();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
