import { randomUUID } from "node:crypto";
import type { RawData, WebSocket } from "ws";
import { InterpretUtterances } from "../../application/interpret-utterances.js";
import { ParticipantName, UserJoined } from "../../domain/events.js";
import { SpeechRecognizer } from "../../ports/speech-recognizer.js";
import { Translator } from "../../ports/translator.js";
import { AudioInbox } from "./audio-inbox.js";
import { Participant, serializeEvent } from "./event-serialization.js";
import { RoomNotifier } from "./room-notifier.js";
import { RoomRegistry, Sink } from "./room-registry.js";

export interface ConnectionDeps {
  translator: Translator;
  recognizerFor: (solo: boolean) => SpeechRecognizer;
}

interface JoinRequest {
  user_name?: string;
  solo?: boolean;
}

// 한 WS 연결의 수명: 첫 텍스트(join) → 세션 시작, 이후 binary 프레임은 오디오.
export function handleConnection(
  socket: WebSocket,
  roomId: string,
  registry: RoomRegistry,
  deps: ConnectionDeps,
): void {
  const inbox = new AudioInbox();
  const session = new ConnectionSession(socket, roomId, registry, deps, inbox);
  socket.on("message", (data, isBinary) => session.receive(data, isBinary));
  socket.on("close", () => session.end());
}

class ConnectionSession {
  private started = false;
  private sink: Sink;

  constructor(
    private readonly socket: WebSocket,
    private readonly roomId: string,
    private readonly registry: RoomRegistry,
    private readonly deps: ConnectionDeps,
    private readonly inbox: AudioInbox,
  ) {
    this.sink = { send: (text) => socket.send(text) };
  }

  receive(data: RawData, isBinary: boolean): void {
    if (isBinary) {
      this.inbox.push(toBytes(data));
      return;
    }
    if (this.started) return;
    this.started = true;
    this.start(parseJoin(data.toString()));
  }

  end(): void {
    this.inbox.close();
    this.registry.leave(this.roomId, this.sink);
  }

  private start(join: JoinRequest): void {
    const name = join.user_name ?? "나";
    const who = Participant.of(randomUUID(), name);
    this.registry.join(this.roomId, this.sink);
    this.announceJoin(name, who);
    void this.interpret(who, join.solo === true);
  }

  private announceJoin(name: string, who: Participant): void {
    const message = serializeEvent(new UserJoined(ParticipantName.of(name)), who);
    if (message === null) return;
    this.registry.broadcast(this.roomId, message);
  }

  private async interpret(who: Participant, solo: boolean): Promise<void> {
    const notifier = new RoomNotifier(this.registry, this.roomId, who);
    const usecase = new InterpretUtterances(this.deps.translator, notifier);
    const recognizer = this.deps.recognizerFor(solo);
    await usecase.run(recognizer.recognize(this.inbox.stream()));
  }
}

function parseJoin(raw: string): JoinRequest {
  try {
    return JSON.parse(raw) as JoinRequest;
  } catch {
    return {};
  }
}

function toBytes(data: RawData): Uint8Array {
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data));
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data);
}
