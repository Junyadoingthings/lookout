import { describe, expect, it } from "vitest";

import { severityFromRuleLevel, severityRank } from "./severity";

describe("severityFromRuleLevel", () => {
  it.each([
    [0, "info"],
    [3, "info"],
    [4, "low"],
    [6, "low"],
    [7, "medium"],
    [11, "medium"],
    [12, "high"],
    [14, "high"],
    [15, "critical"],
  ] as const)("maps level %i to %s", (level, expected) => {
    expect(severityFromRuleLevel(level)).toBe(expected);
  });

  it.each([-1, 16, 7.5, Number.NaN])("rejects %s", (level) => {
    expect(() => severityFromRuleLevel(level)).toThrow(RangeError);
  });
});

describe("severityRank", () => {
  it("ranks critical above info", () => {
    expect(severityRank("critical")).toBeGreaterThan(severityRank("info"));
  });
});
