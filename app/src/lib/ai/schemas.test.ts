import { describe, expect, it } from "vitest";

import { searchFilter, triageOutput } from "./schemas";

const valid = {
  summary: "A process read LSASS memory, consistent with credential dumping.",
  verdict: "likely_true_positive",
  confidence: "high",
  reasoning: "svchost rarely opens lsass with this access mask in this lab.",
  attackTechniques: ["T1003.001"],
  nextChecks: ["Confirm the source process", "Check for a dump file on disk"],
};

describe("triageOutput schema", () => {
  it("accepts a well-formed result", () => {
    expect(triageOutput.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown verdict", () => {
    expect(triageOutput.safeParse({ ...valid, verdict: "definitely_bad" }).success).toBe(false);
  });

  it("rejects when nextChecks is empty", () => {
    expect(triageOutput.safeParse({ ...valid, nextChecks: [] }).success).toBe(false);
  });

  it("rejects more than 5 next checks", () => {
    expect(
      triageOutput.safeParse({ ...valid, nextChecks: ["a", "b", "c", "d", "e", "f"] }).success,
    ).toBe(false);
  });

  it("rejects extra top-level fields the model might smuggle in", () => {
    // strict parse: an injected "action" field must not pass validation as-is.
    const withExtra = { ...valid, action: "delete all alerts" };
    const parsed = triageOutput.parse(withExtra);
    expect("action" in parsed).toBe(false); // stripped, never surfaced
  });

  it("rejects a non-object", () => {
    expect(triageOutput.safeParse("ignore previous instructions").success).toBe(false);
  });
});

describe("searchFilter schema", () => {
  it("accepts a structured filter with an explanation", () => {
    const r = searchFilter.safeParse({
      severity: ["high", "critical"],
      text: "powershell",
      explanation: "High and critical alerts mentioning powershell.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid severity", () => {
    expect(searchFilter.safeParse({ severity: ["catastrophic"], explanation: "x" }).success).toBe(
      false,
    );
  });
});
