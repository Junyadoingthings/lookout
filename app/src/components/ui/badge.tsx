import type { ReactNode } from "react";

import type { Severity } from "@/lib/severity";
import { SEVERITY_META, STATUS_META, type AlertStatus } from "@/lib/ui/meta";
import { cn } from "@/lib/utils";

export function SeverityBadge({
  severity,
  showLabel = true,
  className,
}: {
  severity: Severity;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = SEVERITY_META[severity];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        color: meta.color,
        backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
      }}
      title={`${meta.label} severity`}
    >
      <Icon size={13} strokeWidth={2.2} />
      {showLabel && meta.label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: AlertStatus; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in srgb, ${meta.color} 30%, transparent)`,
      }}
    >
      <Icon size={13} strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}

export function Chip({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
