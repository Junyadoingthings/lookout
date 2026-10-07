# Progress

## Current phase: 0, Setup (done, waiting for go-ahead to start Phase 1)

### Environment (detected 2026-10-02)

| Item | Value |
|---|---|
| Host | MacBook Air M2, arm64, macOS 27.0 |
| RAM / free disk | 16 GB / ~85 GB |
| Node / npm | v22.23.3 / 10.9.9 (at `~/.local/node`) |
| git | 2.54.0, repo identity `Junya <164300276+Junyadoingthings@users.noreply.github.com>` |
| Not installed yet | Homebrew, UTM, gitleaks |

**Topology (changed 2026-10-07 by the new project brief):** Wazuh runs in an Ubuntu 24.04 ARM64 VM in UTM, not Docker. Windows 11 ARM in UTM. Console is Next.js on Vercel + Supabase.
**Versions:** see `docs/ARCHITECTURE.md#versions`. Wazuh pinned to 4.14.8.
**Repo location:** `~/Developer/vantage` (outside iCloud Drive; iCloud sync conflicts with git and node_modules).

### Done (Phase 0)
- Folder structure from the brief (`app/`, `lab/...`, `docs/cases/`)
- Next.js 16.4 + TypeScript strict (plus `noUncheckedIndexedAccess`) + Tailwind 4 in `app/`
- ESLint (no `any`, type-only imports), Prettier with Tailwind class sorting
- Vitest (first test: Wazuh rule level to severity), Playwright smoke test on desktop + mobile
- `.env.example` covering every phase, `SECURITY.md`, `docs/ARCHITECTURE.md` with verified versions, `docs/SETUP.md` skeleton
- GitHub Actions CI: check, build, e2e, gitleaks

### Left for Junya
- Delete the old empty folders from the first attempt: `apps/ infra/ endpoint/ detections/ scenarios/` (my delete was blocked by a permission check). They are not committed.

### Next: Phase 1, Lab
1. Install UTM 4.7.5
2. Download Ubuntu 24.04.5 live server arm64 ISO and Windows 11 ARM64 ISO
3. Build Ubuntu VM (6 GB / 4 cores / 50 GB, Shared Network), install Wazuh 4.14.8 all-in-one
4. Build Windows VM (4 GB / 2 cores / 64 GB), install Sysmon (sysmon-modular) and Wazuh agent
5. Done when Sysmon events show in the Wazuh dashboard
