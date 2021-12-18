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

  SuspendRole = "suspend_role_id",
  LogChannel = "log_channel_id",
}

export async function getGuildSetting(
  guildId: Snowflake,
  key: SettingsKey
): Promise<Snowflake> {
  const prisma = container.resolve<PrismaClient>(kPrisma);

  let data = await prisma.guilds
    .findFirst({
      where: {
        id_: guildId,
      },
    })
    .catch(() => {
      console.log("no guild");
    });

  if (!data) {
    data = await prisma.guilds.create({
      data: {
        id_: guildId,

        afk_check_channel_id: "",
        vet_afk_check_channel_id: "",

        main_section_id: "",
        veteran_section_id: "",

        verified_role_id: "",
        veteran_role_id: "",

        raid_leader_role_id: "",
        vet_raid_leader_role_id: "",

        log_channel_id: "",
        suspend_role_id: "",
      },
    });
  }

  return data[key];
}
