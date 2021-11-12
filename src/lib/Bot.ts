import { Options } from "discord.js";
import { Client, Discord } from "discordx";
import { resolve } from "path";
import { injectable } from "tsyringe";

@Discord()
@injectable()
export class Bot extends Client {
  public constructor() {
    super({
      intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_MEMBERS",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_VOICE_STATES",
      ],
      partials: ["CHANNEL", "REACTION", "GUILD_MEMBER"],
      classes: [
        resolve(__dirname, "../commands", "**/*.{ts,js}"),
        resolve(__dirname, "../events", "**/*.{ts,js}"),
      ],
      // TODO: not hardcode guild ids
      botGuilds: ["884659225224175626"],
      // @ts-ignore
      makeCache: Options.cacheWithLimits({
        GuildInviteManager: 0,
        GuildStickerManager: 0,
        PresenceManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
      }),
      silent: true,
    });
  }
}
