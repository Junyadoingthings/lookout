import { Layers } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page";
import { Reveal } from "@/components/ui/reveal";
import { COVERAGE, RESULT_META, TACTIC_ORDER, type DetectResult } from "@/content/coverage";

export const metadata: Metadata = { title: "ATT&CK coverage" };

export default function CoveragePage() {
  const tactics = TACTIC_ORDER.filter((t) => COVERAGE.some((c) => c.tactic === t));
  const counts = COVERAGE.reduce<Record<DetectResult, number>>(
    (acc, c) => {
      acc[c.result] += 1;
      return acc;
    },
    { default: 0, custom: 0, partial: 0, missed: 0 },
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="ATT&CK coverage"
        description="What I tested with Atomic Red Team, what the default rules caught, and what they missed. The gaps drove the custom rules."
        icon={Layers}
      />

      <div className="space-y-6 p-4 md:p-6">
        <Reveal>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            {(Object.keys(RESULT_META) as DetectResult[]).map((r) => (
              <div key={r} className="bg-surface px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RESULT_META[r].color }} />
                  {RESULT_META[r].label}
                </div>
                <div className="mt-1 text-xl font-semibold tabular text-foreground">{counts[r]}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <p className="max-w-2xl text-sm text-muted">
            The default Wazuh ruleset caught 4 of 8 techniques. The misses included the most serious
            one, LSASS credential dumping, which was also a telemetry gap: Sysmon was not logging the
            access at all until I turned it on. Custom rules now cover every gap.
          </p>
        </Reveal>

        <div className="space-y-4">
          {tactics.map((tactic, i) => {
            const entries = COVERAGE.filter((c) => c.tactic === tactic);
            return (
              <Reveal key={tactic} delay={0.04 * i}>
                <section className="rounded-lg border border-border bg-surface">
                  <div className="border-b border-border px-4 py-2.5">
                    <h2 className="text-sm font-semibold text-foreground">{tactic}</h2>
                  </div>
                  <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                    {entries.map((e) => {
                      const meta = RESULT_META[e.result];
                      return (
                        <div key={e.attackId} className="bg-surface p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-accent">{e.attackId}</span>
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{ color: meta.color, backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-medium text-foreground">{e.technique}</div>
                          <p className="mt-1 text-xs text-muted">{e.note}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
