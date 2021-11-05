import { Bot } from "@lib";
import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import { container, inject, injectable } from "tsyringe";
import { kClient } from "../../tokens";

@injectable()
@Discord()
export class ForceUpdate {
  public constructor(@inject(kClient) public client: Bot) {
    this.client = container?.resolve<Bot>(kClient)!;
  }

  @Slash("forceupdate", {
    description: "force update slash commands when needed.",
  })
  private async execute(interaction: CommandInteraction): Promise<void> {
    await this.client.initApplicationCommands({
      guild: {
        log: true,
      },
    });
    await interaction.reply("done.");
  }
}
