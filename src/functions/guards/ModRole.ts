import { getGuildSetting, SettingsKey } from "@functions";
import { CommandInteraction, GuildMember } from "discord.js";
import { GuardFunction } from "discordx";

export const ModRole = () => {
  const guard: GuardFunction<CommandInteraction> = async (
    interaction,
    _,
    next
  ) => {
    const roleId = await getGuildSetting(
      interaction.guildId,
      SettingsKey.ModRoleId
    );

    const member = interaction.member as GuildMember;
    if (!member.roles.cache.has(roleId)) {
      return await interaction.reply({
        content: "This command can only be ran by moderators.",
        ephemeral: true,
      });
    } else {
      await next();
    }
  };

  return guard;
};
