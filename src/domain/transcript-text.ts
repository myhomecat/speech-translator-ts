export class TranscriptText {
  private constructor(private readonly value: string) {}

  static empty(): TranscriptText {
    return new TranscriptText("");
  }

  static of(value: string): TranscriptText {
    return new TranscriptText(value);
  }

  appended(piece: TranscriptText): TranscriptText {
    return new TranscriptText(this.value + piece.value);
  }

  isEmpty(): boolean {
    return this.value.length === 0;
  }

  serialize(): string {
    return this.value;
  }
}
