import { describe, expect, it } from "vitest";
import { Speaker, UnreadableSpeaker } from "../../src/domain/speaker.js";

describe("Speaker", () => {
  it("문자열 라벨 → 정수 정규화", () => {
    expect(Speaker.fromLabel("2").serialize()).toBe(2);
  });

  it("숫자 아닌 라벨 → 거절", () => {
    expect(() => Speaker.fromLabel("unknown")).toThrow(UnreadableSpeaker);
  });

  it("다른 화자 → 구분", () => {
    expect(Speaker.fromLabel("1").differsFrom(Speaker.fromLabel("2"))).toBe(true);
  });
});
