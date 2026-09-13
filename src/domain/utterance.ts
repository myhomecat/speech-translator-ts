import { Language } from "./language.js";
import { Speaker } from "./speaker.js";
import { Subtitle } from "./subtitle.js";
import { TranscriptText } from "./transcript-text.js";
import { PartialTranscriptProduced, UtteranceFinalized } from "./events.js";

export class Utterance {
  private constructor(
    private readonly speaker: Speaker,
    private readonly text: TranscriptText,
  ) {}

  static openedBy(speaker: Speaker): Utterance {
    return new Utterance(speaker, TranscriptText.empty());
  }

  appended(piece: TranscriptText): Utterance {
    return new Utterance(this.speaker, this.text.appended(piece));
  }

  spokenBy(candidate: Speaker): boolean {
    return !this.speaker.differsFrom(candidate);
  }

  hasContent(): boolean {
    return !this.text.isEmpty();
  }

  partialIn(language: Language): PartialTranscriptProduced {
    return new PartialTranscriptProduced(
      Subtitle.of(this.text, language),
      this.speaker,
    );
  }

  finalizedIn(language: Language): UtteranceFinalized {
    return new UtteranceFinalized(
      Subtitle.of(this.text, language),
      this.speaker,
    );
  }
}
