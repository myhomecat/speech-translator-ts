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
