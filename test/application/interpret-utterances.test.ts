import { describe, expect, it } from "vitest";
import { InterpretUtterances } from "../../src/application/interpret-utterances.js";
import { Language } from "../../src/domain/language.js";
import { Speaker } from "../../src/domain/speaker.js";
import { Subtitle } from "../../src/domain/subtitle.js";
import { TranscriptText } from "../../src/domain/transcript-text.js";
import { SpokenPiece } from "../../src/domain/interpretation.js";
import { DomainEvent, UtteranceTranslated } from "../../src/domain/events.js";

const fakeTranslator = {
  translate: (subtitle: Subtitle, into: Language) =>
    Promise.resolve(
      subtitle.rewrittenAs(
        TranscriptText.of(`(번역)${subtitle.serialize().text}`),
        into,
      ),
    ),
};

const collect = () => {
  const published: DomainEvent[] = [];
  const notifier = {
    publish: (event: DomainEvent): Promise<void> => {
      published.push(event);
      return Promise.resolve();
    },
  };
  return { published, notifier };
};

async function* speech(...pieces: SpokenPiece[]): AsyncIterable<SpokenPiece> {
  yield* pieces;
}

describe("InterpretUtterances", () => {
  it("확정된 발화 → 반대 언어로 번역 발행", async () => {
    const { published, notifier } = collect();
    const usecase = new InterpretUtterances(fakeTranslator, notifier);
    await usecase.run(
      speech({
        text: TranscriptText.of("안녕하세요"),
        language: Language.korean,
        speaker: Speaker.numbered(1),
        endsUtterance: true,
      }),
    );
    const translated = published.at(-1) as UtteranceTranslated;
    expect(translated).toBeInstanceOf(UtteranceTranslated);
    expect(translated.pair.translated.serialize()).toEqual({
      text: "(번역)안녕하세요",
      language: "ja",
    });
  });
});
