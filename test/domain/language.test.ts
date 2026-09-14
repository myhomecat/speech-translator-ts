import { describe, expect, it } from "vitest";
import { Language } from "../../src/domain/language.js";

describe("Language.detect", () => {
  it("한글 → ko", () => {
    expect(Language.detect("안녕하세요")).toBe(Language.korean);
  });

  it("가나 → ja", () => {
    expect(Language.detect("こんにちは")).toBe(Language.japanese);
  });

  it("한자만 → 판별 보류(undefined)", () => {
    expect(Language.detect("納期")).toBeUndefined();
  });

  it("반대 언어 = counterpart", () => {
    expect(Language.korean.counterpart()).toBe(Language.japanese);
  });
});
