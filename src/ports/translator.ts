import { Language } from "../domain/language.js";
import { Subtitle } from "../domain/subtitle.js";

export interface Translator {
  translate(subtitle: Subtitle, into: Language): Promise<Subtitle>;
}
