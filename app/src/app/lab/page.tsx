import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";

import { ArchitectureDiagram } from "@/components/lab/architecture-diagram";
import { PageHeader } from "@/components/ui/page";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = { title: "Lab" };

const VERSIONS: [string, string][] = [
  ["Hypervisor", "UTM 4.7.5 (Apple Silicon)"],
  ["SIEM VM", "Ubuntu 22.04.5 ARM64, Wazuh 4.14.8 (manager, indexer, dashboard)"],
  ["Endpoint VM", "Windows 11 Pro 26H2 ARM64 (build 26300.9457)"],
  ["Telemetry", "Sysmon 15.22 (ARM64) with olafhartong/sysmon-modular + a lab profile"],
  ["Agent", "Wazuh agent 4.14.8 (x86 under emulation; no native ARM64 build)"],
  ["Attacks", "Invoke-AtomicRedTeam 2.3.0"],
  ["Console", "Next.js 16, Drizzle, Supabase Postgres, Claude (server side)"],
];

export default function LabPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Lab"
        description="How the home SOC is built, and why."
        icon={FlaskConical}
      />
      <div className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-6">
        <Reveal>
          <div className="space-y-3 text-sm leading-relaxed text-muted">
            <p>
              I built this lab to learn Level 1 SOC work by doing it: collect logs, run real attack
              techniques, see what fires, and write detections for what the defaults miss. Everything
              runs on one MacBook Air with 16 GB of RAM, so the whole thing is two VMs in UTM on a
              host-only network. The victim is never exposed.
            </p>
            <p>
              Attacks run on the Windows endpoint with Atomic Red Team. Sysmon and the Wazuh agent
              ship the telemetry to Wazuh on the Ubuntu VM. I triage the alerts here, in a console I
              built, with Claude drafting summaries that I accept, edit, or reject.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Architecture</h2>
            <ArchitectureDiagram />
          </section>
        </Reveal>

        <Reveal delay={0.1}>
          <section className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold text-foreground">Versions</h2>
            </div>
            <dl className="divide-y divide-border">
              {VERSIONS.map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[160px_1fr]">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="text-sm text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-sm text-muted">
            The full build, including every problem I hit and how I fixed it, is in the repo&apos;s
            setup guide.{" "}
            <a
              href="https://github.com/Junyadoingthings/vantage"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Source on GitHub
            </a>
            .
          </p>
        </Reveal>
      </div>
    </div>
  );
}
