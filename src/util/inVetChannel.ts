import { container } from 'tsyringe';
import { kPrisma } from '../tokens';

import type { PrismaClient } from '@prisma/client';

// TODO: this does nothing lol
export async function inVetChannel(guildId: string, channelId: string): Promise<boolean> {
	const prisma = container.resolve<PrismaClient>(kPrisma);

	const data = await prisma.guilds.findFirst({
		where: {
			guild_id: guildId,
		},
		select: {
			veteran_section_voice_channel_ids: true,
		},
	});

	return data?.veteran_section_voice_channel_ids.indexOf(channelId) !== -1; // eslint-disable-line @typescript-eslint/prefer-includes
}
