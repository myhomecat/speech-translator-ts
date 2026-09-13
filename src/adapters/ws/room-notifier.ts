import { DomainEvent } from "../../domain/events.js";
import { SubtitleNotifier } from "../../ports/subtitle-notifier.js";
import { Participant, serializeEvent } from "./event-serialization.js";
import { RoomRegistry } from "./room-registry.js";

// 한 참가자의 발화 이벤트를 그 방 전체로 브로드캐스트하는 SubtitleNotifier.
export class RoomNotifier implements SubtitleNotifier {
  constructor(
    private readonly registry: RoomRegistry,
    private readonly roomId: string,
    private readonly who: Participant,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    const message = serializeEvent(event, this.who);
    if (message === null) return;
    this.registry.broadcast(this.roomId, message);
  }
}
