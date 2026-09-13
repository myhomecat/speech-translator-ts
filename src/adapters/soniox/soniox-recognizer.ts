import { SpokenPiece } from "../../domain/interpretation.js";
import { AudioChunk, SpeechRecognizer } from "../../ports/speech-recognizer.js";
import { parseSonioxMessage } from "./message-parsing.js";

export class SonioxConfiguration {
  private constructor(private readonly apiKey: string) {}

  static withKey(apiKey: string): SonioxConfiguration {
    return new SonioxConfiguration(apiKey);
  }

  handshake(): string {
    return JSON.stringify({
      api_key: this.apiKey,
      model: "stt-rt-v4",
      audio_format: "s16le",
      sample_rate: 16000,
      num_channels: 1,
      language_hints: ["ko", "ja"],
      enable_endpoint_detection: true,
      enable_speaker_diarization: true,
    });
  }
}

const SONIOX_ENDPOINT = "wss://stt-rt.soniox.com/transcribe-websocket";

export class SonioxRecognizer implements SpeechRecognizer {
  constructor(private readonly configuration: SonioxConfiguration) {}

  async *recognize(audio: AsyncIterable<AudioChunk>): AsyncIterable<SpokenPiece> {
    const socket = new WebSocket(SONIOX_ENDPOINT);
    const inbox = createInbox(socket);
    await opened(socket);
    socket.send(this.configuration.handshake());
    void pump(audio, socket);
    for await (const raw of inbox) {
      yield* parseSonioxMessage(raw);
    }
  }
}

function opened(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener("error", () => reject(new Error("Soniox 연결 실패")), { once: true });
  });
}

async function pump(audio: AsyncIterable<AudioChunk>, socket: WebSocket): Promise<void> {
  for await (const chunk of audio) {
    socket.send(chunk.serialize());
  }
  // 빈 프레임 = 입력 종료 신호 (Soniox 프로토콜)
  socket.send(new Uint8Array(0));
}

async function* createInbox(socket: WebSocket): AsyncGenerator<string> {
  const queue: string[] = [];
  let wake = (): void => {};
  let closed = false;
  socket.addEventListener("message", (event) => {
    queue.push(String(event.data));
    wake();
  });
  socket.addEventListener("close", () => {
    closed = true;
    wake();
  });
  while (!closed || queue.length > 0) {
    const next = queue.shift();
    if (next !== undefined) {
      yield next;
      continue;
    }
    await new Promise<void>((resolve) => {
      wake = resolve;
    });
  }
}
