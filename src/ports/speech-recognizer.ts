import { SpokenPiece } from "../domain/interpretation.js";

export class AudioChunk {
  private constructor(private readonly bytes: Uint8Array) {}

  static of(bytes: Uint8Array): AudioChunk {
    return new AudioChunk(bytes);
  }

  serialize(): Uint8Array {
    return this.bytes;
  }
}

export interface SpeechRecognizer {
  recognize(audio: AsyncIterable<AudioChunk>): AsyncIterable<SpokenPiece>;
}
