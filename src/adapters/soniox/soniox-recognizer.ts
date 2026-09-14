import { SpokenPiece } from "../../domain/interpretation.js";
import { AudioChunk, SpeechRecognizer } from "../../ports/speech-recognizer.js";
import { SonioxTranscriptReader } from "./message-parsing.js";

export class SonioxCredential {
  private constructor(private readonly apiKey: string) {}

  static of(apiKey: string): SonioxCredential {
    return new SonioxCredential(apiKey);
  }

  reveal(): string {
    return this.apiKey;
  }
}

export class SonioxConfiguration {
  // 화자 구분은 대면(솔로)에서만 켠다 — 조립 주체(composition root)가 결정
  private constructor(
    private readonly credential: SonioxCredential,
    private readonly diarization: boolean,
  ) {}

  static forSolo(credential: SonioxCredential): SonioxConfiguration {
    return new SonioxConfiguration(credential, true);
  }

  static forRoom(credential: SonioxCredential): SonioxConfiguration {
    return new SonioxConfiguration(credential, false);
  }

  handshake(): string {
    return JSON.stringify({
      api_key: this.credential.reveal(),
      model: "stt-rt-v4",
      audio_format: "s16le",
      sample_rate: 16000,
      num_channels: 1,
      language_hints: ["ko", "ja"],
      enable_endpoint_detection: true,
      enable_speaker_diarization: this.diarization,
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
    const reader = new SonioxTranscriptReader();
    for await (const raw of inbox) {
      yield* reader.read(raw);
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
