# VANTAGE

A home SOC lab and the triage console I built on top of it.

I run attacks against a Windows 11 VM with Atomic Red Team, collect the logs with Sysmon and Wazuh, write detection rules for what the defaults miss, and triage the alerts in a web console. The console uses Claude to draft summaries and suggestions. I make every final call.

> Under construction. Current status is in [docs/PROGRESS.md](docs/PROGRESS.md).

## How it fits together

| Half | Runs where | What it does |
| --- | --- | --- |
| Lab | My MacBook (UTM VMs) | Ubuntu VM runs Wazuh. Windows 11 ARM VM runs Sysmon, the Wazuh agent and Atomic Red Team. |
| Console | Vercel + Supabase | Alert queue, alert detail, cases, ATT&CK coverage, detections, AI triage. Works with the lab switched off. |

Every alert in the console came from the lab. Usernames, hostnames and IPs are swapped for lab placeholders before import.

## Repo layout

| Path | Contents |
| --- | --- |
| `app/` | Next.js console |
| `lab/wazuh/rules/` | Custom Wazuh detection rules |
| `lab/wazuh/integration/` | Script that pushes new alerts to the console (Phase 6) |
| `lab/sysmon/` | Sysmon config used on the Windows VM |
| `lab/atomic/` | Runbook: which tests I ran, the commands, what fired |
| `lab/export/` | Alert export and sanitise script |
| `docs/` | Setup guide, architecture, incident write-ups |
| `SECURITY.md` | Security decisions for the console |

## Run the console locally

Needs Node 22.

```bash
cd app
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | What it runs |
| --- | --- |
| `npm run check` | Typecheck, lint, format check, unit tests |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright smoke test (desktop and mobile) |

Building the lab from scratch is covered in [docs/SETUP.md](docs/SETUP.md).
