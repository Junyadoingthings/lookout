/**
 * ATT&CK coverage from Phase 2 (lab/atomic/RUNBOOK.md). Honest: shows what the
 * default Wazuh ruleset caught, what it missed, and what the custom rules now
 * cover. Missed detections are the point.
 */
export type DetectResult = "default" | "custom" | "partial" | "missed";

export interface CoverageEntry {
  attackId: string;
  technique: string;
  tactic: string;
  result: DetectResult;
  note: string;
}

export const COVERAGE: CoverageEntry[] = [
  {
    attackId: "T1033",
    technique: "System Owner/User Discovery",
    tactic: "Discovery",
    result: "custom",
    note: "Missed by defaults (whoami raises no alert). Custom rule 100020 now catches it.",
  },
  {
    attackId: "T1059.001",
    technique: "PowerShell (encoded command)",
    tactic: "Execution",
    result: "default",
    note: "Caught by default rules 91837 / 91800 via script block logging.",
  },
  {
    attackId: "T1547.001",
    technique: "Registry Run Keys",
    tactic: "Persistence",
    result: "custom",
    note: "Missed by defaults. Custom rule 100030 covers Run/RunOnce writes.",
  },
  {
    attackId: "T1053.005",
    technique: "Scheduled Task",
    tactic: "Persistence",
    result: "partial",
    note: "Defaults caught the dropped script (92205), not the task itself. Rule 100050 names it.",
  },
  {
    attackId: "T1136.001",
    technique: "Create Local Account",
    tactic: "Persistence",
    result: "default",
    note: "Caught by default rules 60109 / 60110 from the Security log.",
  },
  {
    attackId: "T1003.001",
    technique: "LSASS Memory",
    tactic: "Credential Access",
    result: "custom",
    note: "The headline gap. Missed, and the telemetry was missing too. Rule 100010 catches it after enabling ProcessAccess logging.",
  },
  {
    attackId: "T1070.004",
    technique: "File Deletion",
    tactic: "Defense Evasion",
    result: "default",
    note: "Caught by default rule 92021, though only level 3.",
  },
  {
    attackId: "T1560.001",
    technique: "Archive via makecab",
    tactic: "Collection",
    result: "custom",
    note: "Missed by defaults. Custom rule 100040 flags LOLBin archivers.",
  },
];

export const RESULT_META: Record<DetectResult, { label: string; color: string }> = {
  default: { label: "Caught by defaults", color: "var(--ok)" },
  custom: { label: "Caught by custom rule", color: "var(--accent)" },
  partial: { label: "Partial", color: "var(--warn)" },
  missed: { label: "Still missed", color: "var(--sev-critical)" },
};

/** Tactics in ATT&CK kill-chain order, for matrix columns. */
export const TACTIC_ORDER = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Exfiltration",
  "Impact",
];
