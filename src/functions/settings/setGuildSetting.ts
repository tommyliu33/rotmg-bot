import type { Database } from "@lib";
import type { Snowflake } from "discord.js";
import { set } from "dot-prop";
import { container } from "tsyringe";
import { kDatabase } from "../../tokens";
import { Guild, SettingsKey } from "./getGuildSetting";

export async function setGuildSetting(
  guildId: Snowflake,
  key: SettingsKey,
  value: any
) {
  const db = container.resolve<Database>(kDatabase);
  const data = (await db.guilds.findOne({ id: guildId })) as unknown as Guild;

  if (typeof data === "object") {
    set(data!, key, value);

    await db.guilds.updateOne(
      {
        id: guildId,
      },
      {
        $set: data,
      },
      {
        upsert: true,
      }
    );
  }
}
