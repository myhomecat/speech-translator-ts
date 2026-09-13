import { describe, expect, it } from "vitest";
import { SonioxConfiguration, SonioxCredential } from "../../src/adapters/soniox/soniox-recognizer.js";

const cred = SonioxCredential.of("k");
const diarizationOf = (config: SonioxConfiguration): boolean =>
  JSON.parse(config.handshake()).enable_speaker_diarization;

describe("SonioxConfiguration", () => {
  it("솔로 → 화자 구분 ON", () => {
    expect(diarizationOf(SonioxConfiguration.forSolo(cred))).toBe(true);
  });

  it("멀티방 → 화자 구분 OFF", () => {
    expect(diarizationOf(SonioxConfiguration.forRoom(cred))).toBe(false);
  });
});
