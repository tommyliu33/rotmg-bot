import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export abstract class PingCommand {
  @Slash("restart", { description: "restart the bot." })
  private async execute(interaction: CommandInteraction): Promise<void> {
    if (interaction.user.id === "313114429451665409") {
      await interaction.reply("restarting");
      process.exit();
    }
  }
}
