import { Subtitle } from "../domain/subtitle.js";
import { AudioChunk } from "./speech-recognizer.js";

export interface SpeechSynthesizer {
  speak(subtitle: Subtitle): Promise<AudioChunk>;
}
