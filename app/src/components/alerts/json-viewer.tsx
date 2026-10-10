"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

/** Collapsible, lightly syntax-highlighted JSON tree. */
export function JsonViewer({ data }: { data: unknown }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted">Raw event</span>
        <CopyButton value={JSON.stringify(data, null, 2)} label="Copy JSON" />
      </div>
      <div className="max-h-[70vh] overflow-auto p-3 font-mono text-xs leading-relaxed">
        <Node value={data} name={null} depth={0} defaultOpen />
      </div>
    </div>
  );
}

function Node({
  value,
  name,
  depth,
  defaultOpen = false,
}: {
  value: unknown;
  name: string | null;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth < 2);
  const isObject = value !== null && typeof value === "object";
  const key = name !== null ? <span className="text-accent">{name}</span> : null;

  if (!isObject) {
    return (
      <div style={{ paddingLeft: depth * 12 }} className="group flex items-start gap-1 py-0.5">
        {key}
        {key && <span className="text-muted-2">:</span>}
        <Scalar value={value} />
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const bracket = Array.isArray(value) ? ["[", "]"] : ["{", "}"];

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 py-0.5 text-left hover:opacity-80"
      >
        <ChevronRight
          size={12}
          className={cn("shrink-0 text-muted-2 transition-transform", open && "rotate-90")}
        />
        {key}
        {key && <span className="text-muted-2">:</span>}
        <span className="text-muted-2">
          {bracket[0]}
          {!open && ` ${entries.length} ${entries.length === 1 ? "item" : "items"} ${bracket[1]}`}
        </span>
      </button>
      {open && (
        <div>
          {entries.map(([k, v]) => (
            <Node key={k} name={k} value={v} depth={depth + 1} />
          ))}
          <div style={{ paddingLeft: 12 }} className="text-muted-2">
            {bracket[1]}
          </div>
        </div>
      )}
    </div>
  );
}

function Scalar({ value }: { value: unknown }) {
  if (typeof value === "string")
    return <span className="break-all text-foreground">&quot;{value}&quot;</span>;
  if (typeof value === "number") return <span style={{ color: "var(--sev-low)" }}>{value}</span>;
  if (typeof value === "boolean")
    return <span style={{ color: "var(--sev-high)" }}>{String(value)}</span>;
  if (value === null) return <span className="text-muted-2">null</span>;
  return <span>{String(value)}</span>;
}
