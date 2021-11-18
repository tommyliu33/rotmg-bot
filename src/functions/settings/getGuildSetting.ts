import { CaseInfo } from "@functions";
import type { Database } from "@lib";
import type { Snowflake } from "discord.js";
import { get } from "dot-prop";
import { container } from "tsyringe";
import { kDatabase } from "../../tokens";

export interface Guild {
  id: Snowflake;

  // general
  moderation: {
    mod_log_channel_id: Snowflake;
    mod_role_id: Snowflake;
    cases: CaseInfo[];
  };

  // rotmg
  rotmg: {
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
  };
}

export enum SettingsKey {
  // moderation
  ModLogChannel = "moderation.mod_log_channel_id",
  ModRoleId = "moderation.mod_role_id",
  Cases = "moderation.cases",

  // rotmg
  AfkCheck = "rotmg.channels.afk_check",
  VetAfkCheck = "rotmg.channels.vet_afk_check",

  MainCategory = "rotmg.categories.main",
  VetCategory = "rotmg.categories.veteran",

  MainUserRole = "rotmg.user_roles.main",
  VetUserRole = "rotmg.user_roles.veteran",
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
