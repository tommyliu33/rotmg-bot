import type { PrismaClient } from ".prisma/client";
import type { Bot } from "@lib";
import type { Snowflake } from "discord-api-types";
import { container } from "tsyringe";
import { kClient, kPrisma } from "../../tokens";

export async function verify(
  guildId: Snowflake,
  userId: Snowflake,
  name: string
) {
  const client = container.resolve<Bot>(kClient);
  const prisma = container.resolve<PrismaClient>(kPrisma);

  const guild = await client.guilds.fetch(guildId).catch(() => {});

  if (guild) {
    const member = await guild.members.fetch(userId).catch(() => {});
    if (member) {
      const data = await prisma.guilds.findFirst({
        where: {
          id_: guildId,
        },
        select: {
          verified_role_id: true,
        },
      });

      // this can probably be cleaner
      const data_ =
        (await prisma.users.findFirst({
          where: {
            id_: userId,
          },
          select: {
            id: true,
            names: true,
            verified_guilds: true,
          },
        })) ??
        (await prisma.users.create({
          data: {
            id_: userId,
            names: [],
            verified_guilds: [],
          },
        }));

      const names = data_?.names;
      // assume they're adding an alt
      if (!names.includes(name)) {
        names?.push(name);

        await prisma.users.update({
          where: {
            id: data_?.id,
          },
          data: {
            names,
          },
        });
      }

      const guilds = data_?.verified_guilds;
      if (guilds.indexOf(guildId) === -1) guilds?.push(guildId);

      await prisma.users.update({
        where: {
          id: data_?.id,
        },
        data: {
          verified_guilds: guilds,
        },
      });

      await member
        .setNickname(names.length === 1 ? names[0] : names.join(" | "))
        .catch(() => {});
      if (!member.roles.cache.has(data?.verified_role_id!))
        await member.roles.add(data!.verified_role_id).catch(() => {});
    }
  }
}
