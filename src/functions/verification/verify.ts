import type { PrismaClient } from ".prisma/client";
import { getGuildSetting, SettingsKey } from "@functions";
import type { Bot } from "../../struct/Bot";
import type { Snowflake } from "discord-api-types";
import { container } from "tsyringe";
import { kClient, kPrisma } from "../../tokens";
import { getLogChannel } from "../getLogChannel";
import { verificationSuccessful } from "@util";

// TODO: Cleanup
export async function verify(
  guildId: Snowflake,
  userId: Snowflake,
  name: string
) {
  const client = container.resolve<Bot>(kClient);
  const prisma = container.resolve<PrismaClient>(kPrisma);

  const guild = await client.guilds.fetch(guildId)!;
  const member = await guild.members.fetch(userId)!;

  const logChannel = await getLogChannel(guildId);

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

  const names = data_.names;
  // assume they're adding an alt
  if (!names.includes(name)) {
    names.push(name);

    await prisma.users.update({
      where: {
        id: data_.id,
      },
      data: {
        names,
      },
    });
  }

  const guilds = data_.verified_guilds;
  if (!guilds.includes(guildId)) guilds.push(guildId);

  await prisma.users.update({
    where: {
      id: data_.id,
    },
    data: {
      verified_guilds: guilds,
    },
  });

  await logChannel?.send({
    embeds: [verificationSuccessful(member, name, names.length !== 1)],
  });

  if (!member.manageable) {
    const tag = ` ${member.user.tag} (\`${member.id}\`)`;
    if (!guild.me?.permissions.has("MANAGE_ROLES")) {
      await logChannel?.send({
        embeds: [
          {
            color: "RED",
            title: "Verification failure",
            description: `Unable to add role for ${tag}`,
          },
        ],
      });
    }

    if (!guild.me?.permissions.has("MANAGE_NICKNAMES")) {
      await logChannel?.send({
        embeds: [
          {
            color: "RED",
            title: "Verification failure",
            description: `Unable to update nickname for ${tag}`,
          },
        ],
      });
    }
  }

  // feat: check for discord name / ign capitalization MAYBE
  await member
    .setNickname(names.length === 1 ? names[0] : names.join(" | "))
    .catch(() => {});

  if (!member.roles.cache.has(data?.verified_role_id!))
    await member.roles.add(data!.verified_role_id).catch(() => {});
}
