/**
 * Wazuh gives every rule a level from 0 to 15. The console groups those levels
 * into five severity buckets, using the same cut-offs as the Wazuh dashboard
 * (low 0-6, medium 7-11, high 12-14, critical 15), with 0-3 split out as "info"
 * because those levels are mostly housekeeping events.
 */
export const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export function severityFromRuleLevel(level: number): Severity {
  if (!Number.isInteger(level) || level < 0 || level > 15) {
    throw new RangeError(`Wazuh rule level must be an integer from 0 to 15, got ${level}`);
  }
  if (level >= 15) return "critical";
  if (level >= 12) return "high";
  if (level >= 7) return "medium";
  if (level >= 4) return "low";
  return "info";
}

/** Higher number sorts first in the alert queue. */
export function severityRank(severity: Severity): number {
  return SEVERITIES.indexOf(severity);
}
