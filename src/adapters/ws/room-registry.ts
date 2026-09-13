export interface Sink {
  send(text: string): void;
}

// 방 → 연결 집합. 브로드캐스트로 방 안의 모든 참가자에게 같은 메시지를 전한다.
export class RoomRegistry {
  private readonly rooms = new Map<string, Set<Sink>>();

  join(roomId: string, sink: Sink): void {
    this.membersOf(roomId).add(sink);
  }

  leave(roomId: string, sink: Sink): void {
    const members = this.rooms.get(roomId);
    if (members === undefined) return;
    members.delete(sink);
    this.dropIfEmpty(roomId, members);
  }

  broadcast(roomId: string, message: Record<string, unknown>): void {
    const members = this.rooms.get(roomId);
    if (members === undefined) return;
    const payload = JSON.stringify(message);
    members.forEach((sink) => sink.send(payload));
  }

  headcount(roomId: string): number {
    return this.rooms.get(roomId)?.size ?? 0;
  }

  private membersOf(roomId: string): Set<Sink> {
    const existing = this.rooms.get(roomId);
    if (existing !== undefined) return existing;
    const created = new Set<Sink>();
    this.rooms.set(roomId, created);
    return created;
  }

  private dropIfEmpty(roomId: string, members: Set<Sink>): void {
    if (members.size === 0) this.rooms.delete(roomId);
  }
}
