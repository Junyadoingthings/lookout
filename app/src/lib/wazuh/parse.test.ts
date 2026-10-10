import { describe, expect, it } from "vitest";

import { sampleDiscoveryAlert, sampleLsassAlert } from "./fixtures";
import { parseAlert } from "./parse";

describe("parseAlert", () => {
  it("normalises the LSASS alert", () => {
    const a = parseAlert(sampleLsassAlert);
    expect(a.sourceId).toBe("abc123");
    expect(a.ruleId).toBe("100010");
    expect(a.ruleLevel).toBe(12);
    expect(a.severity).toBe("high");
    expect(a.mitreIds).toEqual(["T1003.001"]);
    expect(a.mitreTactics).toEqual(["Credential Access"]);
    expect(a.targetImage).toBe("lsass.exe");
    expect(a.userName).toBe("WIN-TNCPGUK91BT\\junya");
    expect(a.agentName).toBe("win-tncpguk91bt");
  });

  it("extracts process and parent from a Sysmon event-1 alert", () => {
    const a = parseAlert(sampleDiscoveryAlert);
    expect(a.processName).toBe("whoami.exe");
    expect(a.parentProcess).toBe("cmd.exe");
    expect(a.commandLine).toBe("whoami /all");
    expect(a.severity).toBe("low");
  });

  it("keeps the whole raw document in rawLog", () => {
    const a = parseAlert(sampleLsassAlert);
    expect((a.rawLog as { rule: { id: number } }).rule.id).toBe(100010);
  });

  it("throws when there is no id to key on", () => {
    const { _id, ...noId } = sampleLsassAlert;
    void _id;
    expect(() => parseAlert(noId)).toThrow();
  });

  it("rejects input missing required fields", () => {
    expect(() => parseAlert({ timestamp: "2026-01-01T00:00:00Z" })).toThrow();
  });

  it("falls back gracefully when optional fields are absent", () => {
    const minimal = {
      _id: "x1",
      timestamp: "2026-10-09T10:00:00.000+02:00",
      rule: { id: 5503, level: 5, description: "PAM login" },
    };
    const a = parseAlert(minimal);
    expect(a.agentName).toBe("unknown");
    expect(a.processName).toBeNull();
    expect(a.mitreIds).toEqual([]);
  });
});
