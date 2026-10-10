"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  className,
  label,
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard blocked */
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded text-muted-2 transition-colors hover:text-foreground",
        className,
      )}
      aria-label={label ?? "Copy"}
      title={label ?? "Copy"}
    >
      {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
    </button>
  );
}
