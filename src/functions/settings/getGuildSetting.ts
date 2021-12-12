import type { PrismaClient } from ".prisma/client";
import type { Snowflake } from "discord.js";
import { container } from "tsyringe";
import { kPrisma } from "../../tokens";

export enum SettingsKey {
  AfkCheck = "afk_check_channel_id",
  VetAfkCheck = "vet_afk_check_channel_id",

  MainSection = "main_section_id",
  VetSection = "veteran_section_id",

  MainUserRole = "verified_role_id",
  VetUserRole = "veteran_role_id",

  RaidLeaderRole = "raid_leader_role_id",
  VetRaidLeaderRole = "vet_raid_leader_role_id",
}

export async function getGuildSetting(
  guildId: Snowflake,
  key: SettingsKey
): Promise<Snowflake> {
  const prisma = container.resolve<PrismaClient>(kPrisma);

  const select = {};
  Reflect.set(select, key, true);

  const data = await prisma.guilds.findFirst({
    where: {
      id_: guildId,
    },
    select,
  });

  return Reflect.get(data!, key);
}
