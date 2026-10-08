# Progress

## Current phase: 1, Lab (Wazuh server done, Windows endpoint next)

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

### Left for Junya
- Delete unused UTM VMs: Debian 11, empty Windows, empty Linux; remove stale Kali + 2nd Ubuntu entries
- Push `lab/wazuh/agent.conf` to `/var/ossec/etc/shared/default/agent.conf` on the server
- Delete the old empty folders from the first attempt: `apps/ infra/ endpoint/ detections/ scenarios/`

### Next
1. Build Windows 11 ARM VM (4 GB / 4 cores / 64 GB, Shared Network)
2. Sysmon (sysmon-modular) + script block logging + Wazuh agent
3. Done when Sysmon events show in the Wazuh dashboard
