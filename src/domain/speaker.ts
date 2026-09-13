export class UnreadableSpeaker extends Error {
  constructor(raw: string) {
    super(`화자 라벨을 읽을 수 없습니다: ${raw}`);
  }
}

export class Speaker {
  private constructor(private readonly label: number) {}

  static numbered(label: number): Speaker {
    return new Speaker(label);
  }

  // Soniox 는 화자를 문자열("1")로 준다 — 정수 라벨로 정규화
  static fromLabel(raw: string): Speaker {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) throw new UnreadableSpeaker(raw);
    return new Speaker(parsed);
  }

  differsFrom(other: Speaker): boolean {
    return this.label !== other.label;
  }

  serialize(): number {
    return this.label;
  }
}
