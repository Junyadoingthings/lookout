# Case 002: Encoded PowerShell execution

**Severity:** Medium · **Verdict:** True positive (simulated) · **ATT&CK:** T1059.001 (PowerShell)

## Summary

PowerShell ran a Base64-encoded command on the endpoint. Attackers encode
commands to hide what they are doing from quick inspection, so an encoded command
is worth a second look even when the decoded content turns out to be harmless.

## What happened

1. The endpoint executed `powershell -EncodedCommand <base64>`.
2. PowerShell script block logging (event 4104) recorded the decoded script.
3. Wazuh raised two default rules: 91837 (level 4, "Get-Content -Stream or
   Invoke-Expression, possible string execution as code") and 91800 (level 10,
   "may be using Base64 decoding method").

## Why this one was caught

Unlike the LSASS case, this was detected by the defaults, because I had turned on
PowerShell script block logging during setup. That one setting is the difference
between seeing the decoded command and seeing nothing.

## Response steps

1. Read the decoded script block to see what actually ran.
2. Check the parent process that launched PowerShell.
3. Look for follow-on activity in the minutes after.

## Lessons learned

- Obfuscated execution is well covered by the defaults once script block logging
  is on. Plain discovery (see case 003 context) is not. The log source you enable
  decides what you can detect.
- Level 4 is low for an encoded command. A tuning candidate is to raise the level
  when `-EncodedCommand` is present.
