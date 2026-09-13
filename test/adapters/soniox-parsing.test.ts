import { describe, expect, it } from "vitest";
import { parseSonioxMessage } from "../../src/adapters/soniox/message-parsing.js";

describe("Soniox 메시지 파싱", () => {
  it("original 토큰 → SpokenPiece (문자열 화자 → 정수 정규화)", () => {
    const pieces = parseSonioxMessage(
      JSON.stringify({
        tokens: [
          { text: "안녕", language: "ko", speaker: "1", translation_status: "original" },
        ],
      }),
    );
    expect(pieces).toHaveLength(1);
    expect(pieces[0]?.text.serialize()).toBe("안녕");
    expect(pieces[0]?.speaker?.serialize()).toBe(1);
  });

  it("translation 토큰 → 버린다 (번역은 Translator 포트 소관)", () => {
    const pieces = parseSonioxMessage(
      JSON.stringify({
        tokens: [{ text: "こんにちは", language: "ja", translation_status: "translation" }],
      }),
    );
    expect(pieces).toEqual([]);
  });

  it("segment_end → 마지막 조각에 발화 종료 표시", () => {
    const pieces = parseSonioxMessage(
      JSON.stringify({
        tokens: [
          { text: "감사", language: "ko", translation_status: "original" },
          { text: "합니다", language: "ko", translation_status: "original" },
        ],
        segment_end: true,
      }),
    );
    expect(pieces.map((piece) => piece.endsUtterance)).toEqual([false, true]);
  });
});
