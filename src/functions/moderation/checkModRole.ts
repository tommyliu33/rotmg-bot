import { CommandInteraction, GuildMember } from "discord.js";
import { getGuildSetting, SettingsKey } from "@functions";
export async function checkModRole(
  interaction: CommandInteraction
): Promise<void> {
  console.log(interaction.member);

  const roleId = await getGuildSetting(
    interaction.guildId!,
    SettingsKey.ModRoleId
  );

  const member = interaction.member as GuildMember;

  if (!member.roles.cache.has(roleId)) {
    return await interaction.reply({
      content: "This command can only be ran by Moderators.",
      ephemeral: true,
    });
  }
}
