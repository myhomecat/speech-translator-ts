import { describe, expect, it } from "vitest";
import { SilenceSpan } from "../../src/domain/silence-span.js";
import { TurnPolicy } from "../../src/domain/turn-policy.js";

describe("TurnPolicy", () => {
  it("침묵 0.9초 → 발화 확정", () => {
    expect(TurnPolicy.shouldFinalize(SilenceSpan.ofSeconds(0.9))).toBe(true);
  });

  it("침묵 0.5초 → 발화 유지", () => {
    expect(TurnPolicy.shouldFinalize(SilenceSpan.ofSeconds(0.5))).toBe(false);
  });
});
