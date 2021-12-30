import type { Snowflake } from 'discord-api-types/v9';
import type { PrismaClient } from '@prisma/client';

import { container } from 'tsyringe';
import { kPrisma } from '../tokens';

export async function inVetChannel(guildId: Snowflake, channelId: Snowflake): Promise<boolean> {
	const prisma = container.resolve<PrismaClient>(kPrisma);

	const data = await prisma.guilds.findFirst({
		where: {
			id_: guildId,
		},
		select: {
			veteran_section_voice_channel_ids: true,
		},
	});

	return data?.veteran_section_voice_channel_ids.indexOf(channelId) !== -1; // eslint-disable-line @typescript-eslint/prefer-includes
}
