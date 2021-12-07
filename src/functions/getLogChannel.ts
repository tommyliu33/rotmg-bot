import { getGuildSetting, SettingsKey } from "@functions";
import type { Bot } from "../struct/Bot";
import type { TextChannel } from "discord.js";
import { container } from "tsyringe";
import { kClient } from "../tokens";

export async function getLogChannel(guildId: string) {
  const client = container.resolve<Bot>(kClient);

  const guild = await client.guilds.fetch(guildId);
  const channelId = await getGuildSetting(guildId, SettingsKey.LogChannel);

  try {
    const return_ = await guild.channels.fetch(channelId);
    if (return_ instanceof Map) {
      return null;
    }

    return return_ as TextChannel;
  } catch {
    return null;
  }
}
