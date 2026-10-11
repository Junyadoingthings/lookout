# Progress

## Current phase: 7 (ship). Code complete + pushed to GitHub public. Vercel connect pending (user).

### Environment (detected 2026-10-02)

| Item | Value |
|---|---|
| Host | MacBook Air M2, arm64, macOS 27.0 |
| RAM / free disk | 16 GB / ~85 GB |
| Node / npm | v22.23.3 / 10.9.9 (at `~/.local/node`) |
| git | 2.54.0, repo identity `Junya <164300276+Junyadoingthings@users.noreply.github.com>` |
| Not installed yet | Homebrew, UTM, gitleaks |

**Topology (changed 2026-10-07 by the new project brief):** Wazuh runs in an Ubuntu 22.04.5 ARM64 VM in UTM (192.168.64.5), not Docker. Windows 11 ARM in UTM. Console is Next.js on Vercel + Supabase.
**Versions:** see `docs/ARCHITECTURE.md#versions`. Wazuh pinned to 4.14.8.
**Repo location:** `~/Developer/vantage` (outside iCloud Drive; iCloud sync conflicts with git and node_modules).

### Done (Phase 0)
- Folder structure from the brief (`app/`, `lab/...`, `docs/cases/`)
- Next.js 16.4 + TypeScript strict (plus `noUncheckedIndexedAccess`) + Tailwind 4 in `app/`
- ESLint (no `any`, type-only imports), Prettier with Tailwind class sorting
- Vitest (first test: Wazuh rule level to severity), Playwright smoke test on desktop + mobile
- `.env.example` covering every phase, `SECURITY.md`, `docs/ARCHITECTURE.md` with verified versions, `docs/SETUP.md` skeleton
- GitHub Actions CI: check, build, e2e, gitleaks

### Done (Phase 1 so far, 2026-10-08/09)
- Ubuntu 22.04.5 VM from UTM gallery: updated, desktop off, root LV extended to 60 GB, SSH on
- DNS pinned to 1.1.1.1 / 8.8.8.8 in `/etc/systemd/resolved.conf` (first install failed to fetch the Wazuh GPG key)
- Wazuh 4.14.8 all-in-one installed; dashboard at https://192.168.64.5, all 4 services active
- Recovered from Mac disk hitting 100% (VM paused, wazuh-manager failed); cleaned Downloads, `fstrim` reclaimed ~20 GB
- Known lab shortcut: VM still uses the gallery image's default password (Junya's choice)

- Windows 11 ARM VM (192.168.64.3): UTM guest tools, time zone SAST
- Sysmon 15.22 (`Sysmon64a.exe`, native ARM64) with sysmon-modular, schema 4.91
- PowerShell script block logging on
- Wazuh agent 4.14.8 (`win11-lab`, x86 under emulation) Active, reading Sysmon + PowerShell channels
- Verified: Sysmon rules 92031 / 92154 firing from win11-lab in Threat Hunting
- `docs/SETUP.md` section 2 written from what actually happened, with troubleshooting table

### Left for Junya
- Delete unused UTM VMs: Debian 11, empty Windows, empty Linux; remove stale Kali + 2nd Ubuntu entries
- Clone Windows VM as `win11-lab CLEAN` before Phase 2
- Delete the old empty folders from the first attempt: `apps/ infra/ endpoint/ detections/ scenarios/`

### Next: Phase 2, Attacks + detections
1. Pick 6-8 Atomic Red Team techniques that run on Windows ARM
2. Run one at a time, record what fired and what didn't in `lab/atomic/RUNBOOK.md`
3. Write 3-5 custom rules in `lab/wazuh/rules/`, re-test
