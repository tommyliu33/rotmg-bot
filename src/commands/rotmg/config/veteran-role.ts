import { setGuildSetting, SettingsKey } from "@functions";
import type { CommandInteraction, Role } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup("config")
export abstract class VeteranRoleCommand {
  @Slash("veteran-role")
  private async execute(
    @SlashOption("role", {
      required: true,
      type: "ROLE",
    })
    role: Role,
    interaction: CommandInteraction
  ): Promise<void> {
    await setGuildSetting(
      interaction.guildId,
      SettingsKey.VetUserRole,
      role.id
    );

    await interaction.reply({
      content: `Updated the veteran role to ${role.toString()}!`,
      ephemeral: true,
    });
  }
}
