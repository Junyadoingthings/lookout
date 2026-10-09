# Architecture

## Overview

```
LAB: MacBook Air M2, UTM "Shared Network" 192.168.64.0/24

  ┌─────────────────────┐  agent → manager   ┌─────────────────────┐
  │ Windows 11 ARM VM   │  TCP 1514 / 1515   │ Ubuntu 24.04 VM     │
  │ Sysmon              │ ─────────────────► │ Wazuh manager       │
  │ Wazuh agent         │                    │ Wazuh indexer :9200 │
  │ Atomic Red Team     │                    │ Wazuh dashboard     │
  └─────────────────────┘                    └──────────┬──────────┘
                                                        │ indexer API
                                                        ▼
                                             ┌─────────────────────┐
                                             │ lab/export (on Mac) │
                                             │ pull → sanitise →   │
                                             │ JSON → import       │
                                             └──────────┬──────────┘
CLOUD                                                   │
                                                        ▼
  ┌─────────────────────┐   reads/writes     ┌─────────────────────┐
  │ Vercel: Next.js     │ ◄────────────────► │ Supabase Postgres   │
  │ console             │                    │ (row-level security)│
  └──────────┬──────────┘                    └─────────────────────┘
             │ server side only
             ▼
  ┌─────────────────────┐
  │ Anthropic API       │
  └─────────────────────┘
```

The lab and the console never need to be online at the same time. Alerts move from the lab to the database with the export script (Phase 3), or with the signed live push (Phase 6).

## Versions

Checked on 2026-10-07 against official sources. Every lab part has to run on ARM64.

| Part | Version | ARM64 status | Source |
| --- | --- | --- | --- |
| UTM | 4.7.5 | Native Apple Silicon | [GitHub releases](https://github.com/utmapp/UTM/releases) |
| Ubuntu | 22.04.5 LTS `arm64` (UTM gallery image, desktop turned off) | Native | [UTM gallery](https://mac.getutm.app/gallery/) |
| Wazuh manager, indexer, dashboard | 4.14.8 | Native `arm64` `.deb` packages | [Packages list](https://github.com/wazuh/wazuh-documentation/blob/v4.14.8/source/installation-guide/packages-list.rst) |
| Windows 11 | Latest ARM64 ISO from Microsoft | Native | [microsoft.com](https://www.microsoft.com/software-download/windows11arm64) |
| Wazuh agent (Windows) | 4.14.8 | **x86 only.** Runs under Windows on ARM's built-in x86/x64 emulation (Prism). | [Windows agent docs](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html) |
| Sysmon | 15.22 (Sysinternals release of 2026-09-10) | Native ARM64 binary `Sysmon64a.exe`, confirmed at install | [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) |
| Sysmon config | olafhartong/sysmon-modular, default `sysmonconfig.xml` | Config only, no binary | [GitHub](https://github.com/olafhartong/sysmon-modular) |
| Invoke-AtomicRedTeam | 2.3.0 | PowerShell runs natively. Some atomics call x64-only tools; Phase 2 picks ones that work. | [GitHub](https://github.com/redcanaryco/invoke-atomicredteam) |
| Node.js | 22 | Native | |
| Next.js | 16.4 | n/a (runs on Vercel) | |

### Choices worth explaining

- **Ubuntu 22.04, not 26.04.** 26.04 is out, but Wazuh 4.14.8 only lists Ubuntu up to 24.04. I planned 24.04 Server, ended up with UTM's ready-made 22.04 image, and kept it because Wazuh supports it. I turned the desktop off (`multi-user.target`) to save about 1 GB of RAM.
- **sysmon-modular over SwiftOnSecurity.** SwiftOnSecurity's config hasn't had a commit since October 2021. sysmon-modular is still maintained (last commit September 2026) and tags events with ATT&CK technique IDs, which feeds straight into the coverage page.
- **Wazuh agent under emulation.** There is no native Windows ARM64 agent. Emulation costs some CPU, which doesn't matter for one lab endpoint. Its event log collection reads the same Windows channels as on x64.
- **Supabase over Neon.** Both are hosted Postgres. Supabase also gives me login for analyst mode and row-level security in the same project, so there's one less service to wire up.
- **Drizzle over Prisma.** Schema is plain TypeScript, queries look like SQL, no generated client binary, and it starts fast on serverless functions.
- **Rate limiting in Postgres.** In-memory counters don't work on Vercel because each request can hit a different instance. A small table in the database we already have avoids adding a Redis service.

## Memory budget (16 GB Mac)

| | RAM | CPU cores | Disk |
| --- | --- | --- | --- |
| Ubuntu + Wazuh VM | 4 GB | 4 | 64 GB (60 GB root after `lvextend`) |
| Windows 11 ARM VM | 4 GB | 4 | 64 GB |
| Left for macOS | ~8 GB | | |

Wazuh's own guide asks for 8 GB for up to 25 agents. With one agent it runs on 4 GB (about 1.6 GB still free after install). I chose 4 GB over 6 GB to leave room for macOS.

Rules learned the hard way on day one:
- **Only these two VMs run at once.** A forgotten third VM pushed the Mac into heavy swap and froze the Wazuh VM.
- **Keep 30 GB+ free on the Mac.** VM disks are thin files that grow. When the Mac disk hit 100%, QEMU paused the VM and `wazuh-manager` failed to start until I restarted it.
- **Run `sudo fstrim -av` in the Ubuntu VM after big changes.** It hands deleted blocks back to macOS (the disk file went from 40 GB to about 25 GB).
