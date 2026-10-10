import type { ParsedAlert } from "./parse";

/**
 * Replaces real identifiers from the lab with stable placeholders before any
 * alert leaves the Mac. The same real value always maps to the same placeholder
 * (so a process tree and timeline still line up), but the mapping is one-way for
 * anyone reading the public data.
 *
 * What gets replaced:
 *   - hostnames (the agent name and any host string in text)
 *   - usernames
 *   - IPv4 addresses (except loopback and documentation ranges)
 *
 * The mapping table is returned so the caller can keep it locally (gitignored)
 * for its own reference, and so re-runs stay consistent if seeded with it.
 */
export interface SanitizeMapping {
  hosts: Record<string, string>;
  users: Record<string, string>;
  ips: Record<string, string>;
}

export function emptyMapping(): SanitizeMapping {
  return { hosts: {}, users: {}, ips: {} };
}

// IPs that are not sensitive and should pass through unchanged.
const SAFE_IPS = new Set(["127.0.0.1", "0.0.0.0", "::1"]);
const IPV4 = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;

function assign(table: Record<string, string>, key: string, make: (n: number) => string): string {
  const existing = table[key];
  if (existing) return existing;
  const next = make(Object.keys(table).length + 1);
  table[key] = next;
  return next;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function mapHost(m: SanitizeMapping, host: string): string {
  return assign(m.hosts, host.toLowerCase(), (n) => `WORKSTATION-${pad(n)}`);
}

/** The account part of a Windows principal, e.g. DOMAIN\jane -> jane */
export function accountName(user: string): string {
  const parts = user.split("\\");
  return parts[parts.length - 1] ?? user;
}

export function mapUser(m: SanitizeMapping, user: string): string {
  // Register only the account name; the domain/host part is handled separately.
  return assign(m.users, accountName(user).toLowerCase(), (n) => `user${pad(n)}`);
}

export function mapIp(m: SanitizeMapping, ip: string): string {
  if (SAFE_IPS.has(ip)) return ip;
  // Keep them inside the documentation range (RFC 5737) so they read as fake.
  return assign(m.ips, ip, (n) => `192.0.2.${n}`);
}

/**
 * Walk any JSON value and replace known hosts/users (by exact token) and all
 * IPv4 addresses. Hosts and users are only swapped where their literal value
 * appears, so we first register them from the structured fields, then sweep the
 * raw log text.
 */
function scrubValue(value: unknown, m: SanitizeMapping): unknown {
  if (typeof value === "string") {
    let out = value.replace(IPV4, (ip) => mapIp(m, ip));
    for (const [real, fake] of Object.entries(m.hosts)) {
      out = out.replace(new RegExp(escapeRegExp(real), "gi"), fake);
    }
    for (const [real, fake] of Object.entries(m.users)) {
      // Word-boundary so "administrator" doesn't partially hit inside other words.
      out = out.replace(new RegExp(`\\b${escapeRegExp(real)}\\b`, "gi"), fake);
    }
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, m));
  if (value && typeof value === "object") {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) obj[k] = scrubValue(v, m);
    return obj;
  }
  return value;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitise one parsed alert in place-free fashion, updating the shared mapping.
 * Call with the same `mapping` across a batch for consistent placeholders.
 */
export function sanitizeAlert(alert: ParsedAlert, mapping: SanitizeMapping): ParsedAlert {
  // Register structured identifiers first so the raw-log sweep catches them too.
  const agentName = mapHost(mapping, alert.agentName);
  const userName = alert.userName ? mapUser(mapping, alert.userName) : null;

  const rawLog = scrubValue(alert.rawLog, mapping) as Record<string, unknown>;

  return {
    ...alert,
    agentName,
    userName,
    commandLine: alert.commandLine ? (scrubValue(alert.commandLine, mapping) as string) : null,
    rawLog,
  };
}

export function sanitizeBatch(
  alerts: ParsedAlert[],
  mapping: SanitizeMapping = emptyMapping(),
): { alerts: ParsedAlert[]; mapping: SanitizeMapping } {
  // Pre-register every host and user so cross-references between alerts resolve
  // to the same placeholder regardless of order.
  for (const a of alerts) {
    mapHost(mapping, a.agentName);
    if (a.userName) mapUser(mapping, a.userName);
  }
  return { alerts: alerts.map((a) => sanitizeAlert(a, mapping)), mapping };
}
