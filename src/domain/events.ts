import { Speaker } from "./speaker.js";
import { Subtitle } from "./subtitle.js";

export class ParticipantName {
  private constructor(private readonly value: string) {}

  static of(value: string): ParticipantName {
    return new ParticipantName(value);
  }

  serialize(): string {
    return this.value;
  }
}

export class UserJoined {
  constructor(readonly participant: ParticipantName) {}
}

export class SpeakerChanged {
  constructor(readonly to: Speaker) {}
}

export class PartialTranscriptProduced {
  constructor(
    readonly subtitle: Subtitle,
    readonly speaker: Speaker,
  ) {}
}

export class UtteranceFinalized {
  constructor(
    readonly subtitle: Subtitle,
    readonly speaker: Speaker,
  ) {}
}

export class TranslatedPair {
  constructor(
    readonly original: Subtitle,
    readonly translated: Subtitle,
  ) {}
}

export class UtteranceTranslated {
  constructor(
    readonly pair: TranslatedPair,
    readonly speaker: Speaker,
  ) {}
}

export type DomainEvent =
  | UserJoined
  | SpeakerChanged
  | PartialTranscriptProduced
  | UtteranceFinalized
  | UtteranceTranslated;
