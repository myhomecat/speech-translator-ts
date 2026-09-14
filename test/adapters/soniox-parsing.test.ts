import { describe, expect, it } from "vitest";
import { SonioxTranscriptReader } from "../../src/adapters/soniox/message-parsing.js";
import { Language } from "../../src/domain/language.js";

const message = (tokens: unknown[]) => JSON.stringify({ tokens });

describe("SonioxTranscriptReader", () => {
  it("확정 토큰 → SpokenPiece (문자열 화자 정규화)", () => {
    const pieces = new SonioxTranscriptReader().read(
      message([{ text: "안녕", is_final: true, speaker: "1" }]),
    );
    expect(pieces).toHaveLength(1);
    expect(pieces[0]?.text.serialize()).toBe("안녕");
    expect(pieces[0]?.speaker?.serialize()).toBe(1);
  });

  it("비확정(재전송) 토큰 → 버린다", () => {
    const pieces = new SonioxTranscriptReader().read(
      message([{ text: "안", is_final: false, speaker: "1" }]),
    );
    expect(pieces).toEqual([]);
  });

  it("<end> → 발화 종료 조각", () => {
    const pieces = new SonioxTranscriptReader().read(
      message([{ text: "<end>", is_final: true, speaker: "1" }]),
    );
    expect(pieces).toHaveLength(1);
    expect(pieces[0]?.endsUtterance).toBe(true);
  });

  it("언어 필드 없음 → 글자로 판별(가나=ja)", () => {
    const pieces = new SonioxTranscriptReader().read(
      message([{ text: "こんにちは", is_final: true, speaker: "1" }]),
    );
    expect(pieces[0]?.language).toBe(Language.japanese);
  });

  it("한자만 토큰 → 직전 언어를 잇는다", () => {
    const reader = new SonioxTranscriptReader();
    reader.read(message([{ text: "こんにちは", is_final: true, speaker: "1" }]));
    const next = reader.read(message([{ text: "納期", is_final: true, speaker: "1" }]));
    expect(next[0]?.language).toBe(Language.japanese);
  });
});
