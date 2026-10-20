# Learnings

Security concepts picked up while building Lookout. Each entry maps to Security+ SY0-701 where relevant.

---

### Read the dependency audit, don't just run the fix
**Context:** A fresh Next.js 16 project reports 5 high-severity issues. All of them are one bug in `braces`, reached only through the ESLint plugin. `npm audit fix --force` "fixes" it by downgrading to Next 14.
**Why it matters:** Vulnerability management is about risk, not the count. Ask: is the vulnerable code shipped? Can an attacker reach it with their input? Here neither is true, so the risk is accepted and written down (`SECURITY.md`), and `npm audit --omit=dev` confirms production dependencies are clean. Blindly applying the fix would have broken the app and swapped one risk for a bigger one.
**Sec+ domain:** 4.0 Security Operations (vulnerability management, risk acceptance).

### Check the platform's support list, not just whether a package exists
**Context:** Ubuntu 26.04 is out, but Wazuh 4.14.8 lists Ubuntu up to 24.04. The Wazuh Windows agent has no ARM64 build; it runs under emulation on Windows 11 ARM.
**Why it matters:** Running a security tool on an unsupported platform means bugs you can't get help with, and silent gaps in what it collects. Knowing exactly what runs natively and what doesn't is part of documenting your environment honestly.
**Sec+ domain:** 4.0 Security Operations (secure baselines, asset inventory).

---

### Pin versions and verify the artifact you're running
**Context:** Wazuh's `4.10.x` Docker images ship amd64 only; `4.14.x` ships amd64 + arm64. On an M2, an unpinned or wrong tag either runs slowly under emulation or silently pulls something you didn't test.
**Why it matters:** Pinning exact versions is part of *configuration/change management*. You know exactly what is deployed, you can reproduce it, and an upstream change can't alter your environment without a deliberate update. The same logic underlies *supply-chain security*: verify what you pull instead of trusting a moving `latest` tag.
**Sec+ domain:** 4.0 Security Operations (configuration management), 2.0 Threats (supply-chain).
**Source:** https://hub.docker.com/r/wazuh/wazuh-manager/tags

---

### Default-allow is a vulnerability: Supabase RLS
**Context:** Supabase's security advisor flagged `rls_disabled_in_public` on all four tables. Supabase auto-grants the `anon` role SELECT/INSERT/UPDATE/DELETE/TRUNCATE on new tables in `public`, and the anon key ships to browsers. With RLS off, anyone with the project URL could read or wipe the database over the REST API.
**Fix:** RLS on with **no policies** (deny by default), plus `revoke all ... from anon, authenticated`. The server connects as `postgres` (BYPASSRLS), so the app is unaffected. RLS is declared in the Drizzle schema so a later `db:push` can't silently switch it off.
**Why it matters:** This is *least privilege* and *secure defaults*. A component that grants everything until told otherwise fails open. Note also that RLS filters rows, but it does not cover `TRUNCATE`. Revoking privileges covers that gap, which makes it *defence in depth*.
**Sec+ domain:** 3.0 Security Architecture (secure defaults, least privilege), 4.0 Security Operations (vulnerability remediation, verifying the fix).
**Source:** https://supabase.com/docs/guides/database/postgres/row-level-security
