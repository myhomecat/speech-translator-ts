export class Speaker {
  private constructor(private readonly label: number) {}

  static numbered(label: number): Speaker {
    return new Speaker(label);
  }

  differsFrom(other: Speaker): boolean {
    return this.label !== other.label;
  }

  serialize(): number {
    return this.label;
  }
}
