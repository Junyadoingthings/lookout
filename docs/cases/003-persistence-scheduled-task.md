# Case 003: Persistence via scheduled task and Run key

**Severity:** Medium · **Verdict:** True positive (simulated) · **ATT&CK:** T1053.005, T1547.001

## Summary

Two persistence techniques ran back to back on the endpoint: a scheduled task was
created, and a value was written to a registry Run key. Both are ways for an
attacker to survive a reboot.

## What happened

1. `schtasks.exe /create` registered logon and startup tasks (T1053.005).
2. A value was added to `...\CurrentVersion\Run` (T1547.001).
3. The defaults caught the script the scheduled-task test dropped into `C:\`
   (rule 92205, level 9, "Powershell process created an executable file in
   Windows root folder") but did not name the task registration itself, and did
   not alert on the Run-key write at all.

## What I changed

- Rule **100050** flags `schtasks.exe /create`, so the task registration is named
  by technique, not just caught sideways through the dropped file.
- Rule **100030** flags writes to Run / RunOnce keys (Sysmon event 13).

## Response steps

1. List scheduled tasks and autostart entries, compare against a known-good
   baseline.
2. Remove the malicious task and Run-key value.
3. Trace what created them.

## Lessons learned

- "Detected" is not the same as "detected well". The defaults surfaced something,
  but not the technique that mattered. Naming the technique correctly is what makes
  an alert actionable for an L1 analyst.
