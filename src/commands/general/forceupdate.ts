import { Bot } from "@lib";
import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import { inject, container } from "tsyringe";
import { kClient } from "../../tokens";

@Discord()
export class Command {
  public constructor(@inject(kClient) public readonly client: Bot) {
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
