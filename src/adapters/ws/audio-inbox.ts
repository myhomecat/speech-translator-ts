import { AudioChunk } from "../../ports/speech-recognizer.js";

// WS binary 프레임을 SpeechRecognizer 가 소비하는 AudioChunk 스트림으로 잇는 큐.
// push 는 연결 핸들러가, 순회는 recognizer 가 한다.
export class AudioInbox {
  private readonly buffer: AudioChunk[] = [];
  private wake: () => void = () => {};
  private closed = false;

  push(bytes: Uint8Array): void {
    this.buffer.push(AudioChunk.of(bytes));
    this.wake();
  }

  close(): void {
    this.closed = true;
    this.wake();
  }

  async *stream(): AsyncIterable<AudioChunk> {
    while (true) {
      const next = this.buffer.shift();
      if (next !== undefined) {
        yield next;
        continue;
      }
      if (this.closed) return;
      await this.blocked();
    }
  }

  private blocked(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = resolve;
    });
  }
}
