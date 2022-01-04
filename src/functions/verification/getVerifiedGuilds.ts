import { container } from 'tsyringe';
import { kClient, kPrisma } from '../../tokens';

import type { PrismaClient } from '.prisma/client';
import type { Bot } from '../../struct/Bot';
import type { Snowflake } from 'discord-api-types';

export async function getVerifiedGuilds(userId: Snowflake): Promise<Snowflake[]> {
	const client = container.resolve<Bot>(kClient);
	const prisma = container.resolve<PrismaClient>(kPrisma);

	const data = await prisma.users.findFirst({
		where: {
			id_: userId,
		},
	});

	const guilds: string[] = [];
	if (!data) return guilds;

	const { verified_guilds } = data;
	for (const guildId_ of verified_guilds) {
		const guild = await client.guilds.fetch(guildId_).catch(() => undefined);
		if (guild) guilds.push(guild.name);
	}

	return guilds;
}
