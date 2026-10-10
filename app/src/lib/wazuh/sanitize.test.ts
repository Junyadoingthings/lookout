import { describe, expect, it } from "vitest";

import { sampleDiscoveryAlert, sampleLsassAlert } from "./fixtures";
import { parseAlert } from "./parse";
import { emptyMapping, mapIp, sanitizeAlert, sanitizeBatch } from "./sanitize";

describe("sanitizeAlert", () => {
  it("replaces the hostname everywhere it appears", () => {
    const a = sanitizeAlert(parseAlert(sampleLsassAlert), emptyMapping());
    expect(a.agentName).toBe("WORKSTATION-01");
    const raw = JSON.stringify(a.rawLog);
    expect(raw).not.toMatch(/win-tncpguk91bt/i);
    expect(raw).toContain("WORKSTATION-01");
  });

  it("replaces the username", () => {
    const a = sanitizeAlert(parseAlert(sampleLsassAlert), emptyMapping());
    expect(a.userName).toBe("user01");
    expect(JSON.stringify(a.rawLog)).not.toMatch(/\bjunya\b/i);
  });

  it("replaces the agent IP with a documentation-range address", () => {
    const a = sanitizeAlert(parseAlert(sampleLsassAlert), emptyMapping());
    const raw = JSON.stringify(a.rawLog);
    expect(raw).not.toContain("192.168.64.3");
    expect(raw).toMatch(/192\.0\.2\.\d+/);
  });

  it("leaves loopback addresses untouched", () => {
    const m = emptyMapping();
    expect(mapIp(m, "127.0.0.1")).toBe("127.0.0.1");
  });

  it("is consistent: the same real value maps to the same placeholder across a batch", () => {
    const parsed = [sampleLsassAlert, sampleDiscoveryAlert].map(parseAlert);
    const { alerts, mapping } = sanitizeBatch(parsed);
    // Both alerts came from the same host and user.
    expect(alerts[0]!.agentName).toBe(alerts[1]!.agentName);
    expect(alerts[0]!.userName).toBe(alerts[1]!.userName);
    expect(Object.keys(mapping.hosts)).toHaveLength(1);
    expect(Object.keys(mapping.users)).toHaveLength(1);
  });

  it("does not leak the real IP, host or user anywhere in the sanitised batch", () => {
    const parsed = [sampleLsassAlert, sampleDiscoveryAlert].map(parseAlert);
    const { alerts } = sanitizeBatch(parsed);
    const dump = JSON.stringify(alerts).toLowerCase();
    for (const secret of ["win-tncpguk91bt", "junya", "192.168.64.3"]) {
      expect(dump).not.toContain(secret);
    }
  });
});
