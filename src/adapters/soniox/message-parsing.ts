import { Language } from "../../domain/language.js";
import { Speaker } from "../../domain/speaker.js";
import { TranscriptText } from "../../domain/transcript-text.js";
import { SpokenPiece } from "../../domain/interpretation.js";

// Soniox 종료 신호. endpoint detection 이 발화 끝에 특수 토큰으로 준다.
const ENDPOINT_MARKERS = ["<end>", "<fin>"];

interface SonioxToken {
  text?: string;
  is_final?: boolean;
  speaker?: string; // Soniox 는 화자를 문자열로 준다
}

interface SonioxMessage {
  tokens?: SonioxToken[];
}

// Soniox 스트림을 도메인이 소비하는 SpokenPiece 로 옮긴다.
// - is_final=false 토큰은 매 메시지 «전체 재전송»이라 버린다(누적하면 중복).
// - 확정 토큰만 델타로 흘리고, <end> 에서 발화를 닫는다.
// - 인식 전용 모드는 토큰에 언어가 없으므로 글자로 판별하고 직전 언어를 잇는다.
export class SonioxTranscriptReader {
  private lastLanguage: Language = Language.korean;

  read(raw: string): SpokenPiece[] {
    const message = JSON.parse(raw) as SonioxMessage;
    return (message.tokens ?? []).flatMap((token) => this.interpret(token));
  }

  private interpret(token: SonioxToken): SpokenPiece[] {
    const text = token.text ?? "";
    if (isEndpoint(text)) return [this.closing(token)];
    if (token.is_final !== true) return [];
    if (text.length === 0) return [];
    return [this.confirmed(text, token)];
  }

  private confirmed(text: string, token: SonioxToken): SpokenPiece {
    const language = Language.detect(text) ?? this.lastLanguage;
    this.lastLanguage = language;
    return {
      text: TranscriptText.of(text),
      language,
      speaker: speakerOf(token),
      endsUtterance: false,
    };
  }

  private closing(token: SonioxToken): SpokenPiece {
    return {
      text: TranscriptText.empty(),
      language: this.lastLanguage,
      speaker: speakerOf(token),
      endsUtterance: true,
    };
  }
}

function isEndpoint(text: string): boolean {
  return ENDPOINT_MARKERS.includes(text);
}

function speakerOf(token: SonioxToken): Speaker | undefined {
  if (token.speaker === undefined) return undefined;
  return Speaker.fromLabel(token.speaker);
}
