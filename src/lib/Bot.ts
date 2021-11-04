import { Database } from "@lib";
import { Client, Discord } from "discordx";
import { resolve } from "path";
import { container, injectable } from "tsyringe";
import { RaidManager } from "./RaidManager";

@Discord()
@injectable()
export class Bot extends Client {
  public raids: RaidManager;

  public constructor() {
    super({
      intents: ["GUILDS"],
      partials: ["CHANNEL"],
      classes: [
        resolve(__dirname, "../commands", "**/*.{ts,js}"),
        resolve(__dirname, "../events", "**/*.{ts,js}"),
      ],
      botGuilds: ["884659225224175626"],
    });

    this.raids = new RaidManager(this);
  }

  public async login(token: string) {
    const database = container.resolve(Database);
    await database.init();
    return super.login(token);
  }
}
