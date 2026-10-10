"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { SEVERITIES } from "@/lib/severity";
import { SEVERITY_META, STATUS_META, type AlertStatus } from "@/lib/ui/meta";
import { cn } from "@/lib/utils";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const sev = params.get("sev")?.split(",").filter(Boolean) ?? [];
  const status = params.get("status")?.split(",").filter(Boolean) ?? [];
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  // Debounce search into the URL.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update("q", q || null), 300);
    return () => clearTimeout(t);
  }, [q, params, update]);

  const toggle = (key: string, current: string[], value: string) => {
    const set = new Set(current);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    update(key, set.size ? [...set].join(",") : null);
  };

  const hasFilters = sev.length || status.length || q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-2"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rule, host, process, command"
          className="h-8 w-56 rounded-md border border-border bg-surface-2 pr-2 pl-8 text-sm text-foreground placeholder:text-muted-2 focus:border-accent focus-visible:outline-none"
        />
      </div>

      <div className="flex items-center gap-1">
        {SEVERITIES.slice()
          .reverse()
          .map((s) => {
            const meta = SEVERITY_META[s];
            const active = sev.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle("sev", sev, s)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs transition-colors",
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
                title={`${meta.label} severity`}
              >
                <meta.icon size={12} />
                <span className="hidden sm:inline">{meta.label}</span>
              </button>
            );
          })}
      </div>

      <select
        value=""
        onChange={(e) => {
          if (e.target.value) toggle("status", status, e.target.value);
        }}
        className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-muted focus:border-accent focus-visible:outline-none"
      >
        <option value="">Status {status.length ? `(${status.length})` : ""}</option>
        {(Object.keys(STATUS_META) as AlertStatus[]).map((s) => (
          <option key={s} value={s}>
            {status.includes(s) ? "✓ " : ""}
            {STATUS_META[s].label}
          </option>
        ))}
      </select>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted hover:text-foreground"
        >
          <X size={13} /> Clear
        </button>
      ) : null}
    </div>
  );
}
