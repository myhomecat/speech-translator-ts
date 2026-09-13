import { Language } from "./language.js";
import { TranscriptText } from "./transcript-text.js";

export class Subtitle {
  private constructor(
    private readonly text: TranscriptText,
    private readonly language: Language,
  ) {}

  static of(text: TranscriptText, language: Language): Subtitle {
    return new Subtitle(text, language);
  }

  counterpartLanguage(): Language {
    return this.language.counterpart();
  }

  rewrittenAs(text: TranscriptText, language: Language): Subtitle {
    return new Subtitle(text, language);
  }

  serialize(): { text: string; language: string } {
    return { text: this.text.serialize(), language: this.language.serialize() };
  }
}
