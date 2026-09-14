export class UnsupportedLanguage extends Error {
  constructor(code: string) {
    super(`지원하지 않는 언어: ${code}`);
  }
}

export class Language {
  static readonly korean = new Language("ko");
  static readonly japanese = new Language("ja");

  private constructor(private readonly code: string) {}

  static fromCode(code: string): Language {
    const found = [Language.korean, Language.japanese].find(
      (candidate) => candidate.code === code,
    );
    if (found === undefined) throw new UnsupportedLanguage(code);
    return found;
  }

  // Soniox 인식 전용 모드는 토큰에 언어를 안 준다 → 글자로 판별.
  // 한자만/기호뿐이면 확신 불가 → undefined(직전 언어 유지는 호출측 몫)
  static detect(text: string): Language | undefined {
    if (/[가-힣]/.test(text)) return Language.korean;
    if (/[ぁ-ゟァ-ヿｦ-ﾟ]/.test(text)) return Language.japanese;
    return undefined;
  }

  counterpart(): Language {
    if (this === Language.korean) return Language.japanese;
    return Language.korean;
  }

  equals(other: Language): boolean {
    return this === other;
  }

  serialize(): string {
    return this.code;
  }
}
