import { describe, expect, it } from "vitest";
import { RoomRegistry, Sink } from "../../src/adapters/ws/room-registry.js";

const recorder = () => {
  const received: string[] = [];
  const sink: Sink = { send: (text) => void received.push(text) };
  return { received, sink };
};

describe("RoomRegistry", () => {
  it("브로드캐스트 → 방 참가자 전원 수신", () => {
    const registry = new RoomRegistry();
    const a = recorder();
    const b = recorder();
    registry.join("r1", a.sink);
    registry.join("r1", b.sink);
    registry.broadcast("r1", { type: "x" });
    expect(a.received).toEqual(['{"type":"x"}']);
    expect(b.received).toEqual(['{"type":"x"}']);
  });

  it("다른 방에는 전달되지 않는다", () => {
    const registry = new RoomRegistry();
    const other = recorder();
    registry.join("r2", other.sink);
    registry.broadcast("r1", { type: "x" });
    expect(other.received).toEqual([]);
  });

  it("전원 퇴장 → 방 정리", () => {
    const registry = new RoomRegistry();
    const a = recorder();
    registry.join("r1", a.sink);
    registry.leave("r1", a.sink);
    expect(registry.headcount("r1")).toBe(0);
  });
});
