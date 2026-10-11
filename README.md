# Lookout

A home SOC lab and the triage console I built on top of it.

I run real attack techniques against a Windows VM, collect the logs with Sysmon and Wazuh, write detection rules for what the defaults miss, and triage the alerts in a web console. The console uses Claude to draft summaries and suggestions. I make every final call.

**Live demo:** _add your Vercel link here_ · **Setup from zero:** [docs/SETUP.md](docs/SETUP.md)

> The demo is public and read-only. Every alert in it came from my lab, with real hostnames, usernames and IPs replaced by placeholders.

## Why I built it

I'm a first-year Network Systems student working through TryHackMe's SOC Level 1 path and studying for Security+. I wanted a project that proves two things: that I can do real Level 1 SOC work, and that I can use AI properly inside a security workflow with a human making the final decision.

## What it shows

### The lab (local, two VMs in UTM on an Apple Silicon Mac)
- **Ubuntu 22.04** running Wazuh 4.14.8 (manager, indexer, dashboard).
- **Windows 11 ARM** running Sysmon, the Wazuh agent, and Atomic Red Team.
- A host-only network, so the victim is never exposed.

### The findings (honest, this is the point)
I ran 8 ATT&CK techniques across 6 tactics. **The default Wazuh ruleset caught 4 of 8.** The misses included the most serious one, LSASS credential dumping, which turned out to be a *telemetry* gap, not just a rule gap: Sysmon was not logging the access at all until I turned it on. I wrote 5 custom rules to close the gaps, and the console shows what fired, what missed, and the false positives my own rules produce.

### The console (Next.js on Vercel + Supabase)
- **Alert queue** with keyboard triage (`j`/`k`/`enter`/`t`/`f`/`e`), filters synced to the URL, and near-duplicate grouping.
- **Alert detail** with a process tree, raw log, ATT&CK mapping, and analyst notes.
- **ATT&CK coverage** map, **Detections** page (my rules and their XML), and a **Lab** page with an architecture diagram.
- **Cases** that group alerts into incidents with a verdict, response steps and lessons.
- **8 AI features**, each labelled AI-generated and reviewable: triage assist, explain-a-log-field, natural-language search, clustering, case-report drafting, a rule assistant, false-positive tuning, and an accuracy tracker that reports how often the AI matched my final verdict, including when it was wrong.

## How I use AI safely

This is a security project, so the AI is treated as a risk, not a magic box. See [SECURITY.md](SECURITY.md) for the detail. In short:
- **Log data is untrusted input.** It is sent to the model wrapped in delimiters, and the prompt says it is data to analyse, never instructions to follow.
- **Every model response is validated against a strict zod schema** and rejected if it does not fit. Model output never triggers an action on its own.
- **Natural-language search becomes a typed filter, never SQL.**
- **The API key stays server-side.** Results are cached, and fresh calls go through a database-backed daily rate limit, so the public demo cannot run up the bill.

## Tech

| Layer | Choice |
| --- | --- |
| SIEM | Wazuh 4.14.8 |
| Endpoint telemetry | Sysmon 15.22 + olafhartong/sysmon-modular |
| Attack simulation | Invoke-AtomicRedTeam 2.3.0 |
| Console | Next.js 16 (App Router), TypeScript strict |
| Database | Supabase Postgres + Drizzle ORM |
| AI | Anthropic Claude, server-side only |
| Hosting | Vercel |

Versions and why each was picked: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run the console locally

Needs Node 22.

```bash
cd app
npm install
cp ../.env.example .env.local   # fill in DATABASE_URL (and optionally ANTHROPIC_API_KEY)
npm run db:push                 # create the tables
npm run seed                    # load a few labelled sample alerts
npm run dev                     # http://localhost:3000
```

| Command | What it runs |
| --- | --- |
| `npm run check` | typecheck, lint, format check, unit tests |
| `npm run build` | production build |
| `npm run test:e2e` | Playwright smoke test (desktop and mobile) |
| `npm run export` / `npm run import` | pull real alerts from the lab, sanitise, load |

Deploying to Vercel: [docs/DEPLOY.md](docs/DEPLOY.md).

## What I learned

A few of the lessons, with more in [docs/LEARNINGS.md](docs/LEARNINGS.md):
- A detection gap can be a telemetry gap. You cannot alert on what you do not collect, so check the endpoint, not just the SIEM.
- A rule that fires is not finished. My LSASS rule immediately produced false positives from `svchost.exe`, which is normal and drives the next tuning cycle.
- Treat AI output as data to validate, never as instructions to run.

## Repo layout

| Path | Contents |
| --- | --- |
| `app/` | Next.js console |
| `lab/wazuh/rules/` | Custom detection rules |
| `lab/sysmon/`, `lab/atomic/`, `lab/export/` | Sysmon config, attack runbook, export/sanitise |
| `docs/` | Setup, architecture, deploy, case write-ups |
| `SECURITY.md` | Security decisions for the console |
