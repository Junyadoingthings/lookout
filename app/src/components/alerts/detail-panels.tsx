import { CornerDownRight, HelpCircle, Terminal } from "lucide-react";

import { Explainable } from "@/components/alerts/explainable";
import { CopyButton } from "@/components/ui/copy-button";
import type { Alert } from "@/db/schema";
import { buildProcessChain, readEventdata, baseName } from "@/lib/wazuh/fields";

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function KeyFields({ alert }: { alert: Alert }) {
  const e = readEventdata(alert.rawLog);
  const rows: { label: string; value: string | null; mono?: boolean; copy?: boolean }[] = [
    { label: "Host", value: alert.agentName, mono: true },
    { label: "User", value: alert.userName ?? e.user, mono: true },
    { label: "Process", value: alert.processName, mono: true },
    { label: "Parent", value: alert.parentProcess, mono: true },
    { label: "Target", value: baseName(e.targetImage), mono: true },
    { label: "Event ID", value: e.eventId, mono: true },
    { label: "Channel", value: e.channel, mono: true },
    { label: "Granted access", value: e.grantedAccess, mono: true },
    { label: "Rule", value: `#${alert.ruleId} (level ${alert.ruleLevel})`, mono: true },
  ].filter((r) => r.value);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-muted">{r.label}</dt>
          <dd
            className={`group flex items-center gap-1.5 ${r.mono ? "font-mono text-xs" : ""} break-all text-foreground`}
          >
            <span>{r.value}</span>
            <span className="opacity-0 transition-opacity group-hover:opacity-100">
              <CopyButton value={r.value ?? ""} />
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CommandLine({ alert, aiReady = false }: { alert: Alert; aiReady?: boolean }) {
  const e = readEventdata(alert.rawLog);
  if (!e.commandLine) return null;
  return (
    <Section
      title="Command line"
      action={
        <span className="flex items-center gap-2">
          {aiReady && (
            <Explainable
              field="CommandLine"
              value={e.commandLine}
              ruleContext={alert.ruleDescription}
              aiReady={aiReady}
            >
              <span className="text-[11px] text-muted-2">explain</span>
            </Explainable>
          )}
          <CopyButton value={e.commandLine} label="Copy command" />
        </span>
      }
    >
      <pre className="overflow-x-auto rounded bg-surface-2 p-2.5 font-mono text-xs break-all whitespace-pre-wrap text-foreground">
        {e.commandLine}
      </pre>
    </Section>
  );
}

export function ProcessTree({ alert }: { alert: Alert }) {
  const chain = buildProcessChain(alert.rawLog);
  if (chain.length === 0) return null;
  return (
    <Section title="Process tree">
      <ol className="space-y-1">
        {chain.map((n, i) => (
          <li key={i} className="flex items-start gap-2" style={{ paddingLeft: i * 16 }}>
            {i > 0 && <CornerDownRight size={14} className="mt-0.5 shrink-0 text-muted-2" />}
            <Terminal size={14} className="mt-0.5 shrink-0 text-muted-2" />
            <div className="min-w-0">
              <div className="font-mono text-xs text-foreground">
                {baseName(n.image)}
                <span className="ml-1.5 rounded bg-surface-2 px-1 text-[10px] text-muted-2">
                  {n.role}
                </span>
              </div>
              <div className="truncate font-mono text-[11px] text-muted-2">{n.image}</div>
              {n.commandLine && (
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted">
                  {n.commandLine}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function AttackMapping({ alert }: { alert: Alert }) {
  if (!alert.mitreIds.length) return null;
  return (
    <Section title="ATT&CK mapping">
      <div className="space-y-2">
        {alert.mitreIds.map((id, i) => (
          <a
            key={id}
            href={`https://attack.mitre.org/techniques/${id.replace(".", "/")}/`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-accent">{id}</span>
              <span className="text-foreground">{alert.mitreTechniques[i] ?? ""}</span>
            </span>
            <span className="text-xs text-muted">
              {alert.mitreTactics[i] ?? alert.mitreTactics[0] ?? ""}
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

export function HowToRead() {
  return (
    <details className="rounded-lg border border-border bg-surface-2 text-sm">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-muted hover:text-foreground">
        <HelpCircle size={15} />
        How to read this
      </summary>
      <div className="space-y-2 border-t border-border px-3 py-2.5 text-muted">
        <p>
          An <span className="text-foreground">alert</span> is one thing a detection rule flagged.
          The <span className="text-foreground">severity</span> comes from the rule&apos;s level.
        </p>
        <p>
          The <span className="text-foreground">process tree</span> shows what launched what. A
          normal tool launched by an unexpected parent is often the first sign of trouble.
        </p>
        <p>
          <span className="text-foreground">ATT&CK</span> maps the behaviour to a known attacker
          technique. The <span className="text-foreground">raw event</span> on the right is the
          original log, with real hostnames, users and IPs replaced by placeholders.
        </p>
      </div>
    </details>
  );
}
