/**
 * Pull alerts from the Wazuh indexer, normalise them, sanitise them, and write
 * JSON ready for import. Nothing real leaves this machine: the output is
 * sanitised, and the real->placeholder mapping is written separately and
 * gitignored.
 *
 * Run (from app/):
 *   npm run export
 * Env (see ../.env.example): WAZUH_INDEXER_URL, WAZUH_INDEXER_USER,
 *   WAZUH_INDEXER_PASSWORD, optional WAZUH_INDEXER_CA_CERT.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Agent, fetch } from "undici";

import { parseAlert } from "@/lib/wazuh/parse";
import { emptyMapping, sanitizeBatch, type SanitizeMapping } from "@/lib/wazuh/sanitize";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, "../../lab/export");
const OUT_ALERTS = resolve(OUT_DIR, "alerts.sanitized.json");
const OUT_MAPPING = resolve(OUT_DIR, "mapping.json"); // gitignored

function env(name: string, required = true): string {
  const v = process.env[name];
  if (!v && required) throw new Error(`Missing env ${name}`);
  return v ?? "";
}

async function makeDispatcher(): Promise<Agent> {
  const caPath = process.env.WAZUH_INDEXER_CA_CERT;
  if (caPath) {
    const ca = await readFile(resolve(here, "..", caPath), "utf8");
    return new Agent({ connect: { ca } });
  }
  console.warn("WAZUH_INDEXER_CA_CERT not set; skipping TLS verification (lab only).");
  return new Agent({ connect: { rejectUnauthorized: false } });
}

async function main() {
  const base = env("WAZUH_INDEXER_URL").replace(/\/$/, "");
  const auth = Buffer.from(
    `${env("WAZUH_INDEXER_USER")}:${env("WAZUH_INDEXER_PASSWORD")}`,
  ).toString("base64");
  const days = Number(process.env.EXPORT_DAYS ?? "7");
  const size = Number(process.env.EXPORT_SIZE ?? "1000");

  const query = {
    size,
    sort: [{ timestamp: "desc" }],
    query: {
      bool: {
        filter: [{ range: { timestamp: { gte: `now-${days}d` } } }],
      },
    },
  };

  const dispatcher = await makeDispatcher();
  const res = await fetch(`${base}/wazuh-alerts-*/_search`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
    body: JSON.stringify(query),
    dispatcher,
  });
  if (!res.ok) {
    throw new Error(`Indexer query failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as { hits: { hits: Array<{ _id: string; _source: unknown }> } };
  const hits = body.hits.hits;
  console.log(`Fetched ${hits.length} alerts from the indexer.`);

  const parsed = [];
  let skipped = 0;
  for (const hit of hits) {
    try {
      // Carry the indexer _id onto the source doc so parse can key on it.
      const src = { ...(hit._source as Record<string, unknown>), _id: hit._id };
      parsed.push(parseAlert(src));
    } catch {
      skipped += 1;
    }
  }
  if (skipped) console.warn(`Skipped ${skipped} alerts that did not parse.`);

  // Reuse an existing mapping so placeholders stay stable across runs.
  let seed: SanitizeMapping = emptyMapping();
  try {
    seed = JSON.parse(await readFile(OUT_MAPPING, "utf8")) as SanitizeMapping;
  } catch {
    /* first run, no mapping yet */
  }

  const { alerts, mapping } = sanitizeBatch(parsed, seed);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_ALERTS, JSON.stringify(alerts, null, 2));
  await writeFile(OUT_MAPPING, JSON.stringify(mapping, null, 2));

  console.log(`Wrote ${alerts.length} sanitised alerts to ${OUT_ALERTS}`);
  console.log(`Mapping (kept local, gitignored) at ${OUT_MAPPING}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
