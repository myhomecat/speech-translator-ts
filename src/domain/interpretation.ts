import { Language } from "./language.js";
import { Speaker } from "./speaker.js";
import { TranscriptText } from "./transcript-text.js";
import { Utterance } from "./utterance.js";
import { DomainEvent, SpeakerChanged } from "./events.js";

export interface SpokenPiece {
  readonly text: TranscriptText;
  readonly language: Language;
  readonly speaker?: Speaker;
  readonly endsUtterance: boolean;
}

export interface Transition {
  readonly next: Interpretation;
  readonly events: ReadonlyArray<DomainEvent>;
}

// 발화 수명주기 전이 기계 — 화자 전환은 «새 조각을 붙이기 전에» 이전 발화를 확정한다
export class Interpretation {
  private constructor(
    private readonly current: Utterance | undefined,
    private readonly language: Language,
  ) {}

  static idle(): Interpretation {
    return new Interpretation(undefined, Language.korean);
  }

  apply(piece: SpokenPiece): Transition {
    const handedOver = this.handOverIfSpeakerChanged(piece);
    return handedOver.next.absorb(piece, handedOver.events);
  }

  finish(): Transition {
    if (this.current === undefined) return { next: this, events: [] };
    if (!this.current.hasContent()) return this.cleared([]);
    return this.cleared([this.current.finalizedIn(this.language)]);
  }

  private handOverIfSpeakerChanged(piece: SpokenPiece): Transition {
    if (piece.speaker === undefined) return { next: this, events: [] };
    if (this.current === undefined) return { next: this, events: [] };
    if (this.current.spokenBy(piece.speaker)) return { next: this, events: [] };
    const finished = this.finish();
    return {
      next: finished.next,
      events: [...finished.events, new SpeakerChanged(piece.speaker)],
    };
  }

  private absorb(piece: SpokenPiece, carried: ReadonlyArray<DomainEvent>): Transition {
    const utterance = this.currentOrOpened(piece).appended(piece.text);
    const grown = new Interpretation(utterance, piece.language);
    if (piece.endsUtterance) return grown.finishCarrying(carried);
    return {
      next: grown,
      events: [...carried, utterance.partialIn(piece.language)],
    };
  }

  private finishCarrying(carried: ReadonlyArray<DomainEvent>): Transition {
    const finished = this.finish();
    return { next: finished.next, events: [...carried, ...finished.events] };
  }

  private currentOrOpened(piece: SpokenPiece): Utterance {
    if (this.current !== undefined) return this.current;
    return Utterance.openedBy(piece.speaker ?? Speaker.numbered(1));
  }

  private cleared(events: ReadonlyArray<DomainEvent>): Transition {
    return { next: new Interpretation(undefined, this.language), events };
  }
}
