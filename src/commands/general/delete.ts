import type { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export abstract class PingCommand {
  @Slash("delete", { description: "pong." })
  private async execute(interaction: CommandInteraction): Promise<void> {
    const c = await interaction.guild?.channels.fetch();
    c?.filter(
      (c) =>
        c.type === "GUILD_VOICE" &&
        c.id !== "892542055170060358" &&
        c.id !== "892542055170060358"
    ).forEach((c) => c.delete());
    await interaction.reply("hi");
  }
}
