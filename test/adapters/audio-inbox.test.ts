import { describe, expect, it } from "vitest";
import { AudioInbox } from "../../src/adapters/ws/audio-inbox.js";

describe("AudioInbox", () => {
  it("push 한 청크를 순서대로 흘리고 close 로 끝난다", async () => {
    const inbox = new AudioInbox();
    inbox.push(new Uint8Array([1]));
    inbox.push(new Uint8Array([2]));
    inbox.close();
    const sizes: number[] = [];
    for await (const chunk of inbox.stream()) {
      sizes.push(chunk.serialize()[0] ?? -1);
    }
    expect(sizes).toEqual([1, 2]);
  });

  it("대기 중 push → 소비자가 깨어난다", async () => {
    const inbox = new AudioInbox();
    const collected: number[] = [];
    const consumer = (async () => {
      for await (const chunk of inbox.stream()) {
        collected.push(chunk.serialize()[0] ?? -1);
      }
    })();
    await Promise.resolve();
    inbox.push(new Uint8Array([7]));
    await new Promise((r) => setTimeout(r, 5));
    inbox.close();
    await consumer;
    expect(collected).toEqual([7]);
  });
});
