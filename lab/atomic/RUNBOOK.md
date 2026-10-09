# Attack runbook

Detection-engineering log for VANTAGE. I run each Atomic Red Team test against the
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
- Ran:
- Fired: 
- Rule(s):
- Verdict (detected / missed / partial):
- Notes:

### 2. T1059.001 — PowerShell EncodedCommand
- Ran:
- Fired:
- Rule(s):
- Verdict:
- Notes:

### 3. T1547.001 — Registry Run Key
- Ran:
- Fired:
- Rule(s):
- Verdict:
- Notes:

### 4. T1053.005 — Scheduled Task
- Ran:
- Fired:
- Rule(s):
- Verdict:
- Notes:

### 5. T1136.001 — Create Local Account
- Ran:
- Fired:
- Rule(s):
- Verdict:
- Notes:

### 6. T1003.001 — LSASS Dump (comsvcs)
- Ran:
- Fired:
- Rule(s):
- Verdict:
- Notes:

### 7. T1070.004 — File Deletion
- Ran:
- Fired:
- Rule(s):
- Verdict:
- Notes:

### 8. T1560.001 — Compress for Exfil (makecab)
- Ran:
- Fired:
- Rule(s):
- Verdict:
- Notes:

## Coverage summary

| Technique | Detected by default rules? | Custom rule needed? |
|---|---|---|
| T1033 | | |
| T1059.001 | | |
| T1547.001 | | |
| T1053.005 | | |
| T1136.001 | | |
| T1003.001 | | |
| T1070.004 | | |
| T1560.001 | | |
