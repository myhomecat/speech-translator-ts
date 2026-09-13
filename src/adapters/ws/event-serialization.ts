import {
  DomainEvent,
  PartialTranscriptProduced,
  UserJoined,
  UtteranceFinalized,
  UtteranceTranslated,
} from "../../domain/events.js";

export class Participant {
  private constructor(
    private readonly id: string,
    private readonly name: string,
  ) {}

  static of(id: string, name: string): Participant {
    return new Participant(id, name);
  }

  stamp(): { user_id: string; user_name: string } {
    return { user_id: this.id, user_name: this.name };
  }
}

// 도메인 이벤트 → WS 메시지(Python 백엔드·프론트와 공유하는 계약). 규칙14: 계약은 어댑터 소관.
// 방으로 보내지 않는 이벤트(SpeakerChanged 등)는 null 을 돌려준다.
export function serializeEvent(
  event: DomainEvent,
  who: Participant,
): Record<string, unknown> | null {
  if (event instanceof PartialTranscriptProduced) return partial(event, who);
  if (event instanceof UtteranceFinalized) return finalized(event, who);
  if (event instanceof UtteranceTranslated) return translated(event, who);
  if (event instanceof UserJoined) return joined(event);
  return null;
}

function partial(
  event: PartialTranscriptProduced,
  who: Participant,
): Record<string, unknown> {
  const subtitle = event.subtitle.serialize();
  return {
    type: "realtime_transcript",
    ...who.stamp(),
    text: subtitle.text,
    is_final: false,
    translated_text: null,
    source_language: subtitle.language,
    target_language: null,
    speaker: event.speaker.serialize(),
  };
}

function finalized(
  event: UtteranceFinalized,
  who: Participant,
): Record<string, unknown> {
  const subtitle = event.subtitle.serialize();
  return {
    type: "realtime_transcript",
    ...who.stamp(),
    text: subtitle.text,
    is_final: true,
    translated_text: null,
    source_language: subtitle.language,
    target_language: null,
    speaker: event.speaker.serialize(),
  };
}

function translated(
  event: UtteranceTranslated,
  who: Participant,
): Record<string, unknown> {
  const original = event.pair.original.serialize();
  const target = event.pair.translated.serialize();
  return {
    type: "transcript",
    ...who.stamp(),
    original_text: original.text,
    original_language: original.language,
    translated_text: target.text,
    translated_language: target.language,
    speaker: event.speaker.serialize(),
  };
}

function joined(event: UserJoined): Record<string, unknown> {
  return {
    type: "user_joined",
    user_name: event.participant.serialize(),
  };
}
