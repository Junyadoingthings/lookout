/**
 * Shapes modelled on the real alerts seen in the VANTAGE lab (rule 100010, the
 * LSASS access detection). Used by tests and the seed script. Not real data:
 * these are hand-written examples.
 */
export const sampleLsassAlert = {
  _id: "abc123",
  timestamp: "2026-10-09T22:50:26.563+02:00",
  agent: { id: "001", name: "win-tncpguk91bt", ip: "192.168.64.3" },
  rule: {
    id: 100010,
    level: 12,
    description: "Credential dumping: C:\\WINDOWS\\system32\\svchost.exe accessed LSASS memory",
    groups: ["sysmon", "vantage", "credential_access"],
    mitre: {
      id: ["T1003.001"],
      tactic: ["Credential Access"],
      technique: ["LSASS Memory"],
    },
  },
  data: {
    win: {
      system: { eventID: "10", channel: "Microsoft-Windows-Sysmon/Operational" },
      eventdata: {
        sourceImage: "C:\\WINDOWS\\system32\\svchost.exe",
        targetImage: "C:\\WINDOWS\\system32\\lsass.exe",
        grantedAccess: "0x1410",
        user: "WIN-TNCPGUK91BT\\junya",
      },
    },
  },
} as const;

export const sampleDiscoveryAlert = {
  _id: "def456",
  timestamp: "2026-10-09T22:22:27.600+02:00",
  agent: { id: "001", name: "win-tncpguk91bt", ip: "192.168.64.3" },
  rule: {
    id: 100020,
    level: 6,
    description: "Discovery: recon binary executed -> whoami.exe",
    groups: ["sysmon", "vantage", "discovery"],
    mitre: { id: ["T1033"], tactic: ["Discovery"], technique: ["System Owner/User Discovery"] },
  },
  data: {
    win: {
      system: { eventID: "1", channel: "Microsoft-Windows-Sysmon/Operational" },
      eventdata: {
        originalFileName: "whoami.exe",
        image: "C:\\Windows\\System32\\whoami.exe",
        parentImage: "C:\\Windows\\System32\\cmd.exe",
        commandLine: "whoami /all",
        user: "WIN-TNCPGUK91BT\\junya",
      },
    },
  },
} as const;
