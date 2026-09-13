import { describe, expect, it } from "vitest";
import { Room, RoomFull, RoomIdentifier } from "../../src/domain/room.js";
import { ParticipantName, UserJoined } from "../../src/domain/events.js";

const room = () => Room.open(RoomIdentifier.of("r1"));

describe("Room", () => {
  it("입장 → UserJoined 이벤트", () => {
    const event = room().join(ParticipantName.of("나"));
    expect(event).toBeInstanceOf(UserJoined);
  });

  it("만석(3명) 방 입장 → 거절", () => {
    const full = room();
    ["a", "b", "c"].forEach((name) => full.join(ParticipantName.of(name)));
    expect(() => full.join(ParticipantName.of("d"))).toThrow(RoomFull);
    expect(full.headcount()).toBe(3);
  });
});
