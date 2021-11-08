import { Client, Discord } from "discordx";
import { resolve } from "path";
import { injectable } from "tsyringe";

@Discord()
@injectable()
export class Bot extends Client {
  public constructor() {
    super({
      intents: ["GUILDS", "GUILD_MESSAGES"],
      partials: ["CHANNEL"],
      classes: [
        resolve(__dirname, "../commands", "**/*.{ts,js}"),
        resolve(__dirname, "../events", "**/*.{ts,js}"),
      ],
      // TODO: not hardcode guild ids
      botGuilds: ["884659225224175626"],
    });
  }
}
