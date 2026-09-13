import { SilenceSpan } from "./silence-span.js";

export class TurnPolicy {
  // 0.9초 — 2026-08 로컬 벤치마크에서 검증된 값. 짧으면 문장 중간이 잘린다
  private static readonly silenceToFinalize = SilenceSpan.ofSeconds(0.9);

  static shouldFinalize(silence: SilenceSpan): boolean {
    return silence.reached(TurnPolicy.silenceToFinalize);
  }
}
