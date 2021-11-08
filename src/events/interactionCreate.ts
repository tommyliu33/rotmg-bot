import { Bot } from "@lib";
import { Interaction } from "discord.js";
import { Discord, On } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kClient } from "../tokens";

@Discord()
@injectable()
export default class InteractionCreateEvent {
  public constructor(@inject(kClient) public client: Bot) {
    this.client = container.resolve<Bot>(kClient)!;
  }

  @On("interactionCreate")
  private async interactionCreate(interaction: any): Promise<void> {
    await this.client.executeInteraction(interaction);
  }
}
