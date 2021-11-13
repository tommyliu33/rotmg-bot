import type { Database } from "@lib";
import type { Snowflake } from "discord.js";
import { get } from "dot-prop";
import { container } from "tsyringe";
import { kDatabase } from "../../tokens";

export interface Guild {
  id: Snowflake;
  channels: {
    afk_check: Snowflake;
    vet_afk_check: Snowflake;
  };
  categories: {
    main: Snowflake;
    veteran: Snowflake;
  };
  user_roles: {
    main: Snowflake;
    veteran: Snowflake;
  };
  leader_roles: {};
}

export enum SettingsKey {
  AfkCheck = "channels.afk_check",
  VetAfkCheck = "channels.vet_afk_check",

  MainCategory = "categories.main",
  VetCategory = "categories.veteran",

  MainUserRole = "user_roles.main",
  VetUserRole = "user_roles.veteran",
}

// probably a better way to do this when requiring multiple keys
// TODO: set guild config if n/a to predefined
export async function getGuildSetting(
  guildId: Snowflake,
  key: SettingsKey
): Promise<Snowflake> {
  const db = container.resolve<Database>(kDatabase);
  const data = await db.guilds.findOne({ id: guildId });

  return get(data!, key!) as Snowflake;
}
