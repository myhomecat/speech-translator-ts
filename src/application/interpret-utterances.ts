import { DomainEvent, UtteranceFinalized, TranslatedPair, UtteranceTranslated } from "../domain/events.js";
import { Interpretation, SpokenPiece } from "../domain/interpretation.js";
import { Translator } from "../ports/translator.js";
import { SubtitleNotifier } from "../ports/subtitle-notifier.js";

export class InterpretUtterances {
  constructor(
    private readonly translator: Translator,
    private readonly notifier: SubtitleNotifier,
  ) {}

  async run(pieces: AsyncIterable<SpokenPiece>): Promise<void> {
    let interpretation = Interpretation.idle();
    for await (const piece of pieces) {
      interpretation = await this.step(interpretation.apply(piece));
    }
    await this.step(interpretation.finish());
  }

  private async step(transition: {
    next: Interpretation;
    events: ReadonlyArray<DomainEvent>;
  }): Promise<Interpretation> {
    for (const event of transition.events) {
      await this.publishWithTranslation(event);
    }
    return transition.next;
  }

  private async publishWithTranslation(event: DomainEvent): Promise<void> {
    await this.notifier.publish(event);
    if (!(event instanceof UtteranceFinalized)) return;
    await this.notifier.publish(await this.translated(event));
  }

  private async translated(event: UtteranceFinalized): Promise<UtteranceTranslated> {
    const target = event.subtitle.counterpartLanguage();
    const translated = await this.translator.translate(event.subtitle, target);
    return new UtteranceTranslated(
      new TranslatedPair(event.subtitle, translated),
      event.speaker,
    );
  }
}
