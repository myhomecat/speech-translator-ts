import { Language } from "../../domain/language.js";
import { Subtitle } from "../../domain/subtitle.js";
import { TranscriptText } from "../../domain/transcript-text.js";
import { Translator } from "../../ports/translator.js";

export class TranslationFailed extends Error {
  constructor(status: number) {
    super(`LibreTranslate 응답 오류: ${status}`);
  }
}

export class LibreTranslateEndpoint {
  private constructor(private readonly baseUrl: string) {}

  static at(baseUrl: string): LibreTranslateEndpoint {
    return new LibreTranslateEndpoint(baseUrl.replace(/\/$/, ""));
  }

  translateUrl(): string {
    return `${this.baseUrl}/translate`;
  }
}

interface LibreTranslateReply {
  translatedText?: string;
}

export class LibreTranslateTranslator implements Translator {
  constructor(private readonly endpoint: LibreTranslateEndpoint) {}

  async translate(subtitle: Subtitle, into: Language): Promise<Subtitle> {
    const source = subtitle.serialize();
    const reply = await this.request(source.text, source.language, into.serialize());
    return subtitle.rewrittenAs(TranscriptText.of(reply), into);
  }

  private async request(text: string, from: string, to: string): Promise<string> {
    const response = await fetch(this.endpoint.translateUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: from, target: to, format: "text" }),
    });
    if (!response.ok) throw new TranslationFailed(response.status);
    const body = (await response.json()) as LibreTranslateReply;
    return body.translatedText ?? "";
  }
}
