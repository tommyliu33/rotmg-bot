import type { Guild, OverwriteResolvable, VoiceChannel } from "discord.js";
import { getGuildSetting, SettingsKey } from "./settings/getGuildSetting";
import logger from "../logger";

// TODO: better way to determine if veteran raid
export async function createChannel(
  guild: Guild,
  name: string,
  veteran: boolean
): Promise<VoiceChannel | undefined> {
  const guildId = guild.id;

  const mainRoleId = await getGuildSetting(guildId, SettingsKey.MainUserRole);
  const vetRoleId = await getGuildSetting(guildId, SettingsKey.VetUserRole);

  const key = veteran ? SettingsKey.VetSection : SettingsKey.MainSection;
  const parentId = await getGuildSetting(guildId, key);

  const permissions: OverwriteResolvable[] = [
    {
      id: guildId,
      allow: [],
      deny: ["CONNECT", "SPEAK", "VIEW_CHANNEL"],
    },
  ];

  if (veteran) {
    permissions.push({
      id: vetRoleId,
      allow: ["CONNECT", "VIEW_CHANNEL"],
    });
  } else {
    permissions.push({
      id: mainRoleId,
      allow: ["CONNECT", "VIEW_CHANNEL"],
      deny: ["SPEAK"],
    });
  }

  try {
    const channel = await guild.channels.create(name, {
      type: "GUILD_VOICE",
      parent: parentId,
      userLimit: 30,
      permissionOverwrites: permissions,
    });

    return channel;
  } catch (e) {
    const err = e as Error;
    logger.error(err, err.message);

    return;
  }
}
