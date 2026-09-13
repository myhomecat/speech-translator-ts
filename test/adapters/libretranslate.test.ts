import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LibreTranslateEndpoint,
  LibreTranslateTranslator,
  TranslationFailed,
} from "../../src/adapters/libretranslate/libretranslate-translator.js";
import { Language } from "../../src/domain/language.js";
import { Subtitle } from "../../src/domain/subtitle.js";
import { TranscriptText } from "../../src/domain/transcript-text.js";

const korean = Subtitle.of(TranscriptText.of("안녕하세요"), Language.korean);
const translator = new LibreTranslateTranslator(
  LibreTranslateEndpoint.at("http://lt:5000/"),
);

afterEach(() => vi.unstubAllGlobals());

describe("LibreTranslateTranslator", () => {
  it("번역 응답 → 대상 언어 Subtitle", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ translatedText: "こんにちは" }), { status: 200 }),
    ));
    const result = await translator.translate(korean, Language.japanese);
    expect(result.serialize()).toEqual({ text: "こんにちは", language: "ja" });
  });

  it("끝 슬래시 정규화 → /translate 로 호출", async () => {
    let calledUrl = "";
    const spy = vi.fn(async (url: string | URL | Request) => {
      calledUrl = String(url);
      return new Response(JSON.stringify({ translatedText: "x" }), { status: 200 });
    });
    vi.stubGlobal("fetch", spy);
    await translator.translate(korean, Language.japanese);
    expect(calledUrl).toBe("http://lt:5000/translate");
  });

  it("오류 응답 → 도메인 예외", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    await expect(translator.translate(korean, Language.japanese)).rejects.toThrow(
      TranslationFailed,
    );
  });
});
