import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export abstract class PingCommand {
  @Slash("restart", { description: "restart the bot" })
  private async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.reply("done");
    process.exit();
  }
}
