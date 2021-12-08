import { Client, Options } from "discord.js";

export class Bot extends Client {
  public constructor() {
    super({
      intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_MEMBERS",
        "GUILD_VOICE_STATES",
        "GUILD_MESSAGE_REACTIONS",

        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_REACTIONS",
      ],
      partials: ["CHANNEL", "REACTION", "GUILD_MEMBER", "MESSAGE"],
      makeCache: Options.cacheWithLimits({
        GuildInviteManager: 0,
        GuildStickerManager: 0,
        PresenceManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
      }),
    });
  }
}
