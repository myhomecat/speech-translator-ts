import { Language } from "../../domain/language.js";
import { Speaker } from "../../domain/speaker.js";
import { TranscriptText } from "../../domain/transcript-text.js";
import { SpokenPiece } from "../../domain/interpretation.js";

interface SonioxToken {
  text?: string;
  language?: string;
  // Soniox 는 화자를 «문자열»("1")로 준다 — Speaker 로 감쌀 때 정수 변환
  speaker?: string;
  translation_status?: string;
}

interface SonioxMessage {
  tokens?: SonioxToken[];
  segment_end?: boolean;
}

// Soniox 는 인식 전용 — translation 토큰은 버린다. 번역은 Translator 포트 소관
export function parseSonioxMessage(raw: string): SpokenPiece[] {
  const message = JSON.parse(raw) as SonioxMessage;
  const pieces = (message.tokens ?? [])
    .filter(isOriginalWithText)
    .map(toSpokenPiece);
  return markLastIfSegmentEnded(pieces, message.segment_end === true);
}

function isOriginalWithText(token: SonioxToken): boolean {
  if (token.translation_status === "translation") return false;
  return (token.text ?? "").length > 0;
}

function toSpokenPiece(token: SonioxToken): SpokenPiece {
  return {
    text: TranscriptText.of(token.text ?? ""),
    language: Language.fromCode(token.language ?? "ko"),
    speaker: token.speaker === undefined ? undefined : Speaker.fromLabel(token.speaker),
    endsUtterance: false,
  };
}

function markLastIfSegmentEnded(
  pieces: SpokenPiece[],
  ended: boolean,
): SpokenPiece[] {
  if (!ended) return pieces;
  const last = pieces.at(-1);
  if (last === undefined) return pieces;
  return [...pieces.slice(0, -1), { ...last, endsUtterance: true }];
}
