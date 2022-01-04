import type { PrismaClient } from '.prisma/client';
import type { Snowflake } from 'discord.js';

import { container } from 'tsyringe';
import { kPrisma } from '../../tokens';

export enum UserSettingsKey {}

interface UserSettings {
	id: Snowflake;
	verified_guilds: Snowflake[];
	stats: Record<Snowflake, number[]>; // { 'guild': [0,0,0,0,0,0];}
}

export async function getUserSettings(userId: Snowflake): Promise<UserSettings> {
	const prisma = container.resolve<PrismaClient>(kPrisma);

	let data = await prisma.users
		.findFirst({
			where: {
				id_: userId,
			},
		})
		.catch(() => {
			console.log('no guild');
			return undefined;
		});

	if (!data) {
		data = await prisma.users.create({
			data: {
				id_: userId,
				names: [],
				stats: {},
				verified_guilds: [],
			},
		});
	}

	// console.log(data);
	return data;
}
