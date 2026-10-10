"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setAlertStatus } from "@/app/alerts/actions";
import { STATUS_META, type AlertStatus } from "@/lib/ui/meta";
import { cn } from "@/lib/utils";

const ORDER: AlertStatus[] = ["new", "in_progress", "true_positive", "false_positive", "escalated"];

export function VerdictBar({ id, status }: { id: string; status: AlertStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const set = (next: AlertStatus) => {
    start(async () => {
      try {
        await setAlertStatus(id, next);
        toast.success(`Marked ${STATUS_META[next].label.toLowerCase()}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ORDER.map((s) => {
        const meta = STATUS_META[s];
        const active = s === status;
        const Icon = meta.icon;
        return (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => set(s)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
              active
                ? "border-transparent text-foreground"
                : "border-border text-muted hover:text-foreground",
            )}
            style={
              active
                ? {
                    backgroundColor: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
                    color: meta.color,
                  }
                : undefined
            }
          >
            <Icon size={13} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
