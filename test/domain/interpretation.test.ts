import { describe, expect, it } from "vitest";
import { Interpretation, SpokenPiece } from "../../src/domain/interpretation.js";
import { Language } from "../../src/domain/language.js";
import { Speaker } from "../../src/domain/speaker.js";
import { TranscriptText } from "../../src/domain/transcript-text.js";
import {
  PartialTranscriptProduced,
  SpeakerChanged,
  UtteranceFinalized,
} from "../../src/domain/events.js";

const korean = (text: string, speaker: number, ends = false): SpokenPiece => ({
  text: TranscriptText.of(text),
  language: Language.korean,
  speaker: Speaker.numbered(speaker),
  endsUtterance: ends,
});

describe("Interpretation", () => {
  it("토큰 누적 → 부분 자막", () => {
    const first = Interpretation.idle().apply(korean("안녕", 1));
    const second = first.next.apply(korean("하세요", 1));
    const partial = second.events.at(-1) as PartialTranscriptProduced;
    expect(partial).toBeInstanceOf(PartialTranscriptProduced);
    expect(partial.subtitle.serialize().text).toBe("안녕하세요");
  });

  it("발화 종료 토큰 → 확정", () => {
    const done = Interpretation.idle().apply(korean("감사합니다", 1, true));
    expect(done.events.at(-1)).toBeInstanceOf(UtteranceFinalized);
  });

  it("화자 전환 → 이전 발화 먼저 플러시", () => {
    const first = Interpretation.idle().apply(korean("안녕하세요", 1));
    const switched = first.next.apply(korean("こんにちは", 2));
    const kinds = switched.events.map((event) => event.constructor);
    expect(kinds).toEqual([
      UtteranceFinalized,
      SpeakerChanged,
      PartialTranscriptProduced,
    ]);
    const flushed = switched.events[0] as UtteranceFinalized;
    expect(flushed.subtitle.serialize().text).toBe("안녕하세요");
    expect(flushed.speaker.serialize()).toBe(1);
  });

  it("빈 발화는 확정하지 않는다", () => {
    expect(Interpretation.idle().finish().events).toEqual([]);
  });
});
