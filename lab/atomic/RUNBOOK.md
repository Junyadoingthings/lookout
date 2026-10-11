# Attack runbook

Detection-engineering log for Lookout. I run each Atomic Red Team test against the
`win11-lab` endpoint, record what Wazuh caught, and note the gaps. The gaps are the
point: they tell me which custom rules to write in Phase 2.

**Framework:** [Invoke-AtomicRedTeam](https://github.com/redcanaryco/invoke-atomicredteam).
Each test is a small, documented action mapped to a MITRE ATT&CK technique, with a
matching cleanup command. I run them one at a time by GUID, from a clone I can roll back.

**Safety rules for this lab**
- The Windows VM is on a host-only/shared network. It is never exposed.
- `win11-lab CLEAN` is a powered-off clone taken before any test. Roll back to it if a
  test leaves the VM dirty.
- I only run the tests listed here, by GUID, and I run each test's cleanup afterwards.
- Credential-access tests (LSASS) produce an artifact on disk; I delete it in cleanup.

## Techniques selected (8 tests, 6 ATT&CK tactics)

All use built-in Windows tooling so they run on Windows 11 ARM without x64 downloads.

| # | Tactic | ATT&CK | Test | GUID | Expected signal |
|---|---|---|---|---|---|
| 1 | Discovery | T1033 | System Owner/User Discovery | 4c4959bf-addf-4b4a-be86-8d09cc1857aa | Sysmon 1: `whoami.exe` |
| 2 | Execution | T1059.001 | PowerShell -EncodedCommand variations | 86a43bad-12e3-4e85-b97c-4d5cf25b95c3 | PowerShell 4104; Sysmon 1 with `-enc` |
| 3 | Persistence | T1547.001 | Registry Run Key | e55be3fd-3521-4610-9d1a-e210e42dcf05 | Sysmon 13: Run key value set |
| 4 | Persistence | T1053.005 | Scheduled Task Startup Script | fec27f65-db86-4c2d-b66c-61945aee87c2 | Sysmon 1: `schtasks.exe /create` |
| 5 | Persistence | T1136.001 | Create local account (cmd) | 6657864e-0323-4206-9344-ac9cd7265a4f | Windows 4720; Sysmon 1: `net user /add` |
| 6 | Credential Access | T1003.001 | LSASS dump via comsvcs.dll | 2536dee2-12fb-459a-8c37-971844fa73be | Sysmon 10: access to `lsass.exe` |
| 7 | Defense Evasion | T1070.004 | File deletion (cmd) | 861ea0b4-708a-4d17-848d-186c9c7f17e3 | Sysmon 23/1: `del` |
| 8 | Collection | T1560.001 | Compress for exfil with makecab | 2a7bc405-9555-4f49-ace2-b2ae2941d629 | Sysmon 1: `makecab.exe` |

## How I run each test

On the endpoint, in PowerShell as Administrator (one-time framework install):

```
Install-Module -Name invoke-atomicredteam,powershell-yaml -Scope CurrentUser -Force
Import-Module invoke-atomicredteam
$g(for each) : Invoke-AtomicTest <Txxxx> -TestGuids <guid> -GetPrereqs
               Invoke-AtomicTest <Txxxx> -TestGuids <guid>
               (triage in Wazuh)
               Invoke-AtomicTest <Txxxx> -TestGuids <guid> -Cleanup
```

Default install path for the atomics folder is `C:\AtomicRedTeam`.

## Results

Filled in as each test runs. For each: did it fire, at what rule level, the Wazuh rule
ID, and whether the default rules named the right ATT&CK technique.

### 1. T1033 — System Owner/User Discovery
- Ran: 2026-10-09, GUID 4c4959bf, `whoami` executed on win11-lab
- Fired: no dedicated alert
- Rule(s): none (only unrelated 92154 taskschd image-load noise in the window)
- Verdict: **MISSED by default rules**
- Notes: Wazuh indexes alerts, not raw events, so `whoami` leaves no trace in the queue at all. `whoami.exe` is a normal admin tool, so the defaults stay silent. Classic L1 gap: discovery recon is invisible unless you build for it. Custom rule candidate.

### 2. T1059.001 — PowerShell EncodedCommand
- Ran: 2026-10-09, GUID 86a43bad
- Fired: yes
- Rule(s): 91837 (level 4) "Powershell executed Get-Content -Stream or Invoke-Expression. Possible string execution as code"
- Verdict: **DETECTED by default rules**
- Notes: Caught via PowerShell script block logging (4104). Nice contrast with T1033: encoded/obfuscated execution is flagged, plain discovery is not. Level 4 is low, though, so it would sit far down a busy queue. Tuning candidate: raise level when `-EncodedCommand` is present.

### 3. T1547.001 — Registry Run Key
- Ran: 2026-10-09, GUID e55be3fd, reg add to ...CurrentVersion\Run
- Fired: no dedicated Run-key alert observed in review searches
- Rule(s): none confirmed
- Verdict: **MISSED by default rules** (gap, confirm on custom-rule validation)
- Notes: Sysmon event 13 (registry value set) is logged, but no default rule promotes a Run-key write to an alert. Custom rule candidate.

### 4. T1053.005 — Scheduled Task
- Ran: 2026-10-09, GUID fec27f65, created T1053_005_OnLogon + _OnStartup
- Fired: yes
- Rule(s): 92205 "Powershell process created an executable file in Windows root folder" (lvl 9)
- Verdict: **DETECTED (partial)**
- Notes: Caught the startup script dropped into C:\, not the schtasks registration itself. Good enough to surface, but a dedicated schtasks rule would name the technique correctly.

### 5. T1136.001 — Create Local Account
- Ran: 2026-10-09, GUID 6657864e, `net user /add`
- Fired: yes
- Rule(s): 60109 "User account enabled or created" (lvl 8), 60110 "User account changed" (lvl 8)
- Verdict: **DETECTED by default rules**
- Notes: From the Windows Security event channel (4720), not Sysmon. Clean, high-signal detection.

### 6. T1003.001 — LSASS Dump (comsvcs)
- Ran: 2026-10-09, GUID 2536dee2, comsvcs.dll MiniDump of lsass.exe, exit 0
- Fired: NO alert (searched *lsass* / *credential*, nothing)
- Rule(s): none
- Verdict: **MISSED by default rules**
- Notes: THE headline gap. Credential dumping (ATT&CK's most prized access) ran and Wazuh stayed silent. Sysmon event 10 (ProcessAccess to lsass) is logged by sysmon-modular, but no default Wazuh rule promotes it to an alert. Top priority custom rule.

### 7. T1070.004 — File Deletion
- Ran: 2026-10-09, GUID 861ea0b4 (prereq file absent, del still invoked)
- Fired: yes
- Rule(s): 92021 "Powershell was used to delete files or directories" (lvl 3)
- Verdict: **DETECTED (low severity)**
- Notes: Level 3 is very low and would be buried in a real queue. Indicator-removal matters after an incident, so a tuning bump is worth considering.

### 8. T1560.001 — Compress for Exfil (makecab)
- Ran: 2026-10-09, GUID 2a7bc405 (source file absent; makecab.exe still launched)
- Fired: no makecab alert observed
- Rule(s): none
- Verdict: **MISSED** (partial run; re-test with prereqs to confirm)
- Notes: makecab.exe is a living-off-the-land archiving tool. No default rule flags it. Custom rule candidate, lower priority than LSASS.

## Coverage summary

**4 of 8 detected by default rules.** Misses: T1033 discovery, T1547.001 Run key, T1003.001 LSASS dump (highest priority), T1560.001 makecab. These drive the custom rules in `lab/wazuh/rules/`.


| Technique | Detected by default rules? | Custom rule needed? |
|---|---|---|
| T1033 | No | Yes - flag discovery binaries (whoami/systeminfo/net) |
| T1059.001 | Yes (91837, lvl 4) | Optional - raise level on -enc |
| T1547.001 | No | Yes - Run key registry writes |
| T1053.005 | Partial (92205, lvl 9) | Optional - dedicated schtasks rule |
| T1136.001 | Yes (60109/60110, lvl 8) | No |
| T1003.001 | **No** | **Yes - flag ProcessAccess to lsass.exe** |
| T1070.004 | Yes (92021, lvl 3) | Optional - raise level |
| T1560.001 | No | Yes - makecab/LOLBin archiving |

## Custom rule validation (2026-10-09)

After deploying `lab/wazuh/rules/local_rules.xml` and re-running the missed tests:

- **100020 (discovery)** fires at level 6 on `whoami.exe` / `quser.exe`. Was invisible before. VALIDATED.
- **100010 (LSASS access)** fires at level 12. But first I had to fix the telemetry:
  the sysmon-modular balanced profile does not log ProcessAccess (event 10) to
  lsass, so `Get-WinEvent ... Id=10 | ... lsass` returned nothing. Applied
  `lab/sysmon/lookout-sysmon.xml` to turn on LSASS ProcessAccess logging, re-ran
  the dump, and 100010 fired. VALIDATED. Lesson: you cannot alert on what you do
  not collect; a detection gap can be a telemetry gap, not just a rule gap.
- **100010 false positives:** `svchost.exe` and `MicrosoftEdgeUpdate.exe` legitimately
  open lsass and tripped the rule. Real detection, needs tuning. Next step is to
  exclude known-good sourceImage paths (or raise level only on unusual grantedAccess
  masks like 0x1410/0x1010). Good candidate for the Phase 5 AI FP-tuning feature.

### Key takeaways for the writeup
1. Default Wazuh + sysmon-modular caught 4 of 8 techniques. The misses included the
   most serious one (LSASS credential dumping).
2. The LSASS miss was a telemetry gap, not a rule gap. Found it by checking the raw
   Sysmon log on the endpoint, not just the SIEM.
3. Custom rules closed the gaps; one immediately showed false positives, which is
   normal and drives the next tuning cycle.
