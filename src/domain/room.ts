import { ParticipantName, UserJoined } from "./events.js";

export class RoomFull extends Error {
  constructor() {
    super("방이 가득 찼습니다");
  }
}

export class RoomIdentifier {
  private constructor(private readonly value: string) {}

  static of(value: string): RoomIdentifier {
    return new RoomIdentifier(value);
  }

  serialize(): string {
    return this.value;
  }
}

export class Participants {
  private static readonly capacity = 3;

  private constructor(private readonly names: ReadonlyArray<ParticipantName>) {}

  static empty(): Participants {
    return new Participants([]);
  }

  admitted(name: ParticipantName): Participants {
    if (this.names.length >= Participants.capacity) throw new RoomFull();
    return new Participants([...this.names, name]);
  }

  headcount(): number {
    return this.names.length;
  }
}

export class Room {
  private constructor(
    private readonly identifier: RoomIdentifier,
    private participants: Participants,
  ) {}

  static open(identifier: RoomIdentifier): Room {
    return new Room(identifier, Participants.empty());
  }

  join(name: ParticipantName): UserJoined {
    this.participants = this.participants.admitted(name);
    return new UserJoined(name);
  }

  headcount(): number {
    return this.participants.headcount();
  }
}
