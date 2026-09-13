import { DomainEvent } from "../domain/events.js";

export interface SubtitleNotifier {
  publish(event: DomainEvent): Promise<void>;
}
