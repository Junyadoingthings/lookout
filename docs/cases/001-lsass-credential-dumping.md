# Case 001: LSASS credential access on WORKSTATION-01

**Severity:** High · **Verdict:** True positive (simulated) · **ATT&CK:** T1003.001 (OS Credential Dumping: LSASS Memory)

## Summary

A process opened a handle to `lsass.exe` on the Windows endpoint, consistent with
an attempt to read credentials out of memory. This is the technique behind tools
like Mimikatz. In this lab the access was generated with an Atomic Red Team test
using `comsvcs.dll` MiniDump.

## What happened

1. The endpoint ran the credential-dump test, which calls `rundll32`/`comsvcs.dll`
   to dump LSASS memory to disk.
2. Sysmon recorded a ProcessAccess (event 10) against `lsass.exe`.
3. Wazuh raised custom rule **100010** at level 12: "Credential dumping: ...
   accessed LSASS memory".

## The catch: this was invisible at first

The default Wazuh ruleset did not alert on this at all. When I checked the
endpoint directly, Sysmon had **no event 10 for lsass** either: the sysmon-modular
"balanced" profile does not log ProcessAccess to LSASS by default. So the most
serious technique in the set produced no telemetry and no alert.

The fix was two parts: enable LSASS ProcessAccess logging in the Sysmon config,
then write rule 100010 to promote it to a high-severity alert. After that, the
same dump fired the rule at level 12.

## Response steps

1. Isolate the host from the network.
2. Reset credentials that were cached or used on the host.
3. Identify the source process that opened LSASS and how it got there.
4. Confirm whether a dump file was written and whether it left the host.

## Lessons learned

- A detection gap can be a telemetry gap. You cannot alert on what you do not
  collect, so verify logging on the endpoint, not just rules in the SIEM.
- Rule 100010 immediately produced false positives from `svchost.exe` and
  `MicrosoftEdgeUpdate.exe`, which legitimately read LSASS. The next step is to
  exclude known-good source images rather than lower the severity.
