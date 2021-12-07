import type { guilds, PrismaClient } from ".prisma/client";
import type { Snowflake } from "discord.js";
import { container } from "tsyringe";
import { kPrisma } from "../../tokens";

export async function getGuild(guildId: Snowflake): Promise<guilds | null> {
  const prisma = container.resolve<PrismaClient>(kPrisma);

  const data = await prisma.guilds.findFirst({
    where: {
      id_: guildId,
    },
  });

  return data;
}
