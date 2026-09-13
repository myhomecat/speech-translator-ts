export class SilenceSpan {
  private constructor(private readonly seconds: number) {}

  static ofSeconds(seconds: number): SilenceSpan {
    return new SilenceSpan(seconds);
  }

  reached(threshold: SilenceSpan): boolean {
    return this.seconds >= threshold.seconds;
  }
}
