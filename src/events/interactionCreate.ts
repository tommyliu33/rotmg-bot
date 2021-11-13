import type { Bot } from "@lib";
import { ArgsOf, Discord, On } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kClient } from "../tokens";

@Discord()
@injectable()
export class Event {
  public constructor(@inject(kClient) public readonly client: Bot) {
    this.client = container.resolve<Bot>(kClient);
  }

  @On("interactionCreate")
  private async execute([interaction]: ArgsOf<"interactionCreate">) {
    await this.client.executeInteraction(interaction);
  }
}
