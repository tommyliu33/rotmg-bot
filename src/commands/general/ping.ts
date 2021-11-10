import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export abstract class PingCommand {
  @Slash("ping", { description: "pong." })
  private async execute(interaction: CommandInteraction): Promise<void> {
    return await interaction.reply("pong.");
  }
}
