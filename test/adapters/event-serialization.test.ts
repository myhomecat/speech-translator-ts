import { describe, expect, it } from "vitest";
import { Participant, serializeEvent } from "../../src/adapters/ws/event-serialization.js";
import { Language } from "../../src/domain/language.js";
import { Speaker } from "../../src/domain/speaker.js";
import { Subtitle } from "../../src/domain/subtitle.js";
import { TranscriptText } from "../../src/domain/transcript-text.js";
import {
  PartialTranscriptProduced,
  SpeakerChanged,
  TranslatedPair,
  UtteranceTranslated,
} from "../../src/domain/events.js";

const who = Participant.of("u1", "나");
const ko = Subtitle.of(TranscriptText.of("안녕"), Language.korean);
const ja = Subtitle.of(TranscriptText.of("こんにちは"), Language.japanese);

describe("serializeEvent", () => {
  it("부분 자막 → realtime_transcript(is_final=false)", () => {
    const msg = serializeEvent(new PartialTranscriptProduced(ko, Speaker.numbered(1)), who);
    expect(msg).toMatchObject({
      type: "realtime_transcript",
      user_id: "u1",
      text: "안녕",
      is_final: false,
      source_language: "ko",
      speaker: 1,
    });
  });

  it("번역 완료 → transcript(원문+번역)", () => {
    const event = new UtteranceTranslated(new TranslatedPair(ko, ja), Speaker.numbered(2));
    expect(serializeEvent(event, who)).toMatchObject({
      type: "transcript",
      original_text: "안녕",
      original_language: "ko",
      translated_text: "こんにちは",
      translated_language: "ja",
      speaker: 2,
    });
  });

  it("방으로 안 보내는 이벤트 → null", () => {
    expect(serializeEvent(new SpeakerChanged(Speaker.numbered(2)), who)).toBeNull();
  });
});
