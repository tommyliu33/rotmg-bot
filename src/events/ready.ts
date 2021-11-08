import { Bot } from "@lib";
import { Discord, Once } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kClient } from "../tokens";

@Discord()
@injectable()
export default class ReadyEvent {
  public constructor(@inject(kClient) public client: Bot) {
    this.client = container.resolve<Bot>(kClient)!;
  }

  @Once("ready")
  private async ready(): Promise<void> {
    await this.client.initApplicationCommands({
      guild: { log: false },
    });
  }
}
