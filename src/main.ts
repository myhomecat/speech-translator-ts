import { LibreTranslateEndpoint, LibreTranslateTranslator } from "./adapters/libretranslate/libretranslate-translator.js";
import {
  SonioxConfiguration,
  SonioxCredential,
  SonioxRecognizer,
} from "./adapters/soniox/soniox-recognizer.js";
import { SubtitleServer } from "./adapters/ws/ws-server.js";
import { SpeechRecognizer } from "./ports/speech-recognizer.js";

// composition root — 유일하게 「무엇을 무엇에 꽂을지」 아는 곳(규칙14).
function main(): void {
  const port = Number(process.env.PORT ?? "8000");
  const credential = SonioxCredential.of(process.env.SONIOX_API_KEY ?? "");
  const translator = new LibreTranslateTranslator(
    LibreTranslateEndpoint.at(process.env.LIBRETRANSLATE_URL ?? "http://localhost:5000"),
  );

  const recognizerFor = (solo: boolean): SpeechRecognizer => {
    const config = solo
      ? SonioxConfiguration.forSolo(credential)
      : SonioxConfiguration.forRoom(credential);
    return new SonioxRecognizer(config);
  };

  new SubtitleServer({ translator, recognizerFor }).listen(port);
  console.log(`[speech-translator-ts] listening on :${port}`);
}

main();
