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
