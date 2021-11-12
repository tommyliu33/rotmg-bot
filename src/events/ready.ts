import { Bot } from "@lib";
import { Discord, Once } from "discordx";
import { container, inject, injectable } from "tsyringe";
import logger from "../logger";
import { kClient } from "../tokens";

@Discord()
@injectable()
export class Event {
  public constructor(@inject(kClient) public readonly client: Bot) {
    this.client = container.resolve<Bot>(kClient);
  }

  @Once("ready")
  private async execute() {
    await this.client.initApplicationCommands({
      guild: { log: false },
    });
    logger.info("[bot] ready");
  }
}
