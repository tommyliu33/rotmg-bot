import type { TextChannel } from "discord.js";
import { container } from "tsyringe";
import { getGuildSetting, SettingsKey } from "@functions";
import { kClient } from "../tokens";
import type { Bot } from "@lib";
import { Collection } from "@discordjs/collection";

export async function getLogChannel(guildId: string) {
  const client = container.resolve<Bot>(kClient);

  const guild = await client.guilds.fetch(guildId);
  const channelId = await getGuildSetting(guildId, SettingsKey.LogChannel);

  try {
    const return_ = await guild.channels.fetch(channelId);
    if (return_ instanceof Collection) {
      return null;
    }

    return return_ as TextChannel;
  } catch {
    return null;
  }
}
