import { Database } from "@lib";
import type { Guild, VoiceChannel } from "discord.js";
import { DIService } from "discordx";
import { kDatabase } from "../tokens";

export async function createChannel(
  guild: Guild,
  name: string,
  veteran: boolean
): Promise<VoiceChannel | undefined> {
  const container = DIService.container;
  const db = container?.resolve<Database>(kDatabase);
  const cfg = await db?.getGuild(guild.id);

  console.log(veteran);
  const parentId = cfg?.categories[veteran ? "veteran" : "main"];

  try {
    const channel = await guild.channels.create(name, {
      type: "GUILD_VOICE",
      parent: parentId,
      userLimit: 50, // TODO: custom
      permissionOverwrites: [
        {
          id: guild.id,
          allow: [],
          deny: ["CONNECT", "SPEAK", "VIEW_CHANNEL"],
        },
        {
          id: cfg?.user_roles.main!,
          allow: ["CONNECT", "VIEW_CHANNEL"],
          deny: ["SPEAK"],
        },
      ],
    });

    return channel;
  } catch (e) {
    console.log(`[error] :: ${e}`);
    return undefined;
  }
}
