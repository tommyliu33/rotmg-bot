import { PrismaClient } from ".prisma/client";
import { set } from "dot-prop";
import { container } from "tsyringe";
import { kPrisma } from "../../tokens";
import { SettingsKey } from "./getGuildSetting";

import type { Snowflake } from "discord.js";

export async function setGuildSetting(
  guildId: Snowflake,
  key: SettingsKey,
  value: any
) {
  const prisma = container.resolve<PrismaClient>(kPrisma);
  const data = await prisma.guilds.findFirst({
    where: {
      id_: guildId,
    },
  });

  const { id, ...data_ } = data!;

  await prisma.guilds.update({
    where: {
      id,
    },
    data: {
      ...set(data_, key, value),
    },
  });
}
