import { getGuildSetting, SettingsKey } from "@functions";
import type { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";

export const AfkCheckChannel = () => {
  const guard: GuardFunction<CommandInteraction> = async (
    interaction,
    _,
    next
  ) => {
    const channels = [
      await getGuildSetting(interaction.guildId, SettingsKey.AfkCheck),
      await getGuildSetting(interaction.guildId, SettingsKey.VetAfkCheck),
    ];

    if (!channels.includes(interaction.channelId)) {
      return await interaction.reply({
        content: "This command can only be ran in the afk check channels.",
        ephemeral: true,
      });
    } else {
      await next();
    }
  };

  return guard;
};
