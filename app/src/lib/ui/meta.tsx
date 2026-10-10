import {
  AlertOctagon,
  AlertTriangle,
  ArrowRightLeft,
  Ban,
  Bug,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  Eye,
  FileSearch,
  FlaskConical,
  Info,
  KeyRound,
  Layers,
  type LucideIcon,
  Play,
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import type { Severity } from "@/lib/severity";

export interface SeverityMeta {
  label: string;
  icon: LucideIcon;
  color: string; // css var token
  rank: number;
}

export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  critical: { label: "Critical", icon: AlertOctagon, color: "var(--sev-critical)", rank: 4 },
  high: { label: "High", icon: ShieldAlert, color: "var(--sev-high)", rank: 3 },
  medium: { label: "Medium", icon: AlertTriangle, color: "var(--sev-medium)", rank: 2 },
  low: { label: "Low", icon: CircleAlert, color: "var(--sev-low)", rank: 1 },
  info: { label: "Info", icon: Info, color: "var(--sev-info)", rank: 0 },
};

export type AlertStatus = "new" | "in_progress" | "true_positive" | "false_positive" | "escalated";

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const STATUS_META: Record<AlertStatus, StatusMeta> = {
  new: { label: "New", icon: CircleDot, color: "var(--accent)" },
  in_progress: { label: "In progress", icon: Play, color: "var(--warn)" },
  true_positive: { label: "True positive", icon: ShieldAlert, color: "var(--sev-high)" },
  false_positive: { label: "False positive", icon: Ban, color: "var(--muted)" },
  escalated: { label: "Escalated", icon: AlertOctagon, color: "var(--sev-critical)" },
};

/** The 12 top-level ATT&CK tactics we care about, with an icon each. */
export const TACTIC_META: Record<string, { label: string; icon: LucideIcon }> = {
  "initial access": { label: "Initial Access", icon: ArrowRightLeft },
  execution: { label: "Execution", icon: Terminal },
  persistence: { label: "Persistence", icon: ServerCog },
  "privilege escalation": { label: "Privilege Escalation", icon: ShieldAlert },
  "defense evasion": { label: "Defense Evasion", icon: Eye },
  "credential access": { label: "Credential Access", icon: KeyRound },
  discovery: { label: "Discovery", icon: Search },
  "lateral movement": { label: "Lateral Movement", icon: ArrowRightLeft },
  collection: { label: "Collection", icon: Layers },
  "command and control": { label: "Command and Control", icon: ServerCog },
  exfiltration: { label: "Exfiltration", icon: ArrowRightLeft },
  impact: { label: "Impact", icon: Bug },
};

/** Primary navigation items with their section mark icons. */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/alerts", label: "Alerts", icon: ShieldAlert, shortcut: "g a" },
  { href: "/cases", label: "Cases", icon: FileSearch, shortcut: "g c" },
  { href: "/coverage", label: "Coverage", icon: Layers, shortcut: "g v" },
  { href: "/detections", label: "Detections", icon: ShieldCheck, shortcut: "g d" },
  { href: "/lab", label: "Lab", icon: FlaskConical, shortcut: "g l" },
];

export const ICONS = { CheckCircle2, Info };
