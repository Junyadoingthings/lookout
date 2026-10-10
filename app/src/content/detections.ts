/**
 * The custom Wazuh rules from lab/wazuh/rules/local_rules.xml, with what each
 * catches and its known false positives. Kept in sync with the deployed rules.
 */
export interface Detection {
  id: string;
  title: string;
  level: number;
  attackIds: string[];
  tactic: string;
  catches: string;
  falsePositives: string;
  validated: boolean;
  example?: string; // a rule.description this rule produced in the lab
  xml: string;
}

export const DETECTIONS: Detection[] = [
  {
    id: "100010",
    title: "LSASS memory access (credential dumping)",
    level: 12,
    attackIds: ["T1003.001"],
    tactic: "Credential Access",
    catches:
      "Any process opening a handle to lsass.exe (Sysmon event 10). This is the gap that mattered most: the comsvcs.dll dump ran and the defaults stayed silent.",
    falsePositives:
      "Legitimate security tooling and Windows itself (svchost.exe, MicrosoftEdgeUpdate.exe) read LSASS. In the lab these fired the rule, so in a real environment you exclude known-good source images before alerting.",
    validated: true,
    example: "Credential dumping: C:\\WINDOWS\\system32\\svchost.exe accessed LSASS memory",
    xml: `<rule id="100010" level="12">
  <if_group>windows</if_group>
  <field name="win.system.channel">Microsoft-Windows-Sysmon/Operational</field>
  <field name="win.system.eventID">^10$</field>
  <field name="win.eventdata.targetImage" type="pcre2">(?i)\\\\lsass\\.exe$</field>
  <description>Credential dumping: $(win.eventdata.sourceImage) accessed LSASS memory</description>
  <mitre><id>T1003.001</id></mitre>
</rule>`,
  },
  {
    id: "100020",
    title: "Discovery via built-in binaries",
    level: 6,
    attackIds: ["T1033", "T1082", "T1016"],
    tactic: "Discovery",
    catches:
      "Common recon tools running (whoami, systeminfo, ipconfig, net, nltest, quser, hostname, tasklist). Low severity on purpose: one alone is normal admin work. The value is correlation, several from one host in a short window.",
    falsePositives:
      "High. Admins and scripts run these constantly. Do not page on a single hit; use it as a correlation signal.",
    validated: true,
    example: "Discovery: recon binary executed -> whoami.exe",
    xml: `<rule id="100020" level="6">
  <if_group>windows</if_group>
  <field name="win.system.channel">Microsoft-Windows-Sysmon/Operational</field>
  <field name="win.system.eventID">^1$</field>
  <field name="win.eventdata.originalFileName" type="pcre2">(?i)^(whoami\\.exe|systeminfo\\.exe|ipconfig\\.exe|net\\.exe|net1\\.exe|nltest\\.exe|quser\\.exe|hostname\\.exe|tasklist\\.exe)$</field>
  <description>Discovery: recon binary executed -> $(win.eventdata.originalFileName)</description>
  <mitre><id>T1033</id><id>T1082</id><id>T1016</id></mitre>
</rule>`,
  },
  {
    id: "100030",
    title: "Registry Run key persistence",
    level: 10,
    attackIds: ["T1547.001"],
    tactic: "Persistence",
    catches: "A value written to a Run or RunOnce autostart key (Sysmon event 13).",
    falsePositives:
      "Installers and updaters legitimately add Run keys. Medium severity, so it surfaces for review without paging.",
    validated: false,
    xml: `<rule id="100030" level="10">
  <if_group>windows</if_group>
  <field name="win.system.channel">Microsoft-Windows-Sysmon/Operational</field>
  <field name="win.system.eventID">^13$</field>
  <field name="win.eventdata.targetObject" type="pcre2">(?i)\\\\(CurrentVersion\\\\Run|CurrentVersion\\\\RunOnce)\\\\</field>
  <description>Persistence: registry Run key value set -> $(win.eventdata.targetObject)</description>
  <mitre><id>T1547.001</id></mitre>
</rule>`,
  },
  {
    id: "100040",
    title: "Archiving tool launched (exfil staging)",
    level: 8,
    attackIds: ["T1560.001"],
    tactic: "Collection",
    catches: "makecab.exe or diantz.exe launching (Sysmon event 1), used to stage data for exfil.",
    falsePositives: "Windows servicing and some installers call makecab. Medium severity.",
    validated: false,
    xml: `<rule id="100040" level="8">
  <if_group>windows</if_group>
  <field name="win.system.channel">Microsoft-Windows-Sysmon/Operational</field>
  <field name="win.system.eventID">^1$</field>
  <field name="win.eventdata.originalFileName" type="pcre2">(?i)^(makecab\\.exe|diantz\\.exe)$</field>
  <description>Collection: archiving tool launched -> $(win.eventdata.commandLine)</description>
  <mitre><id>T1560.001</id></mitre>
</rule>`,
  },
  {
    id: "100050",
    title: "Scheduled task created from command line",
    level: 8,
    attackIds: ["T1053.005"],
    tactic: "Persistence",
    catches:
      "schtasks.exe /create (Sysmon event 1). The defaults only caught the script this test dropped in C:\\, not the task registration. This names the technique correctly.",
    falsePositives: "Legitimate software installs scheduled tasks. Medium severity.",
    validated: false,
    xml: `<rule id="100050" level="8">
  <if_group>windows</if_group>
  <field name="win.system.channel">Microsoft-Windows-Sysmon/Operational</field>
  <field name="win.system.eventID">^1$</field>
  <field name="win.eventdata.originalFileName" type="pcre2">(?i)^schtasks\\.exe$</field>
  <field name="win.eventdata.commandLine" type="pcre2">(?i)/create</field>
  <description>Persistence: scheduled task created from command line -> $(win.eventdata.commandLine)</description>
  <mitre><id>T1053.005</id></mitre>
</rule>`,
  },
];
