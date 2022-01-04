import { container } from 'tsyringe';
import { kPrisma } from '../../tokens';

import { GuildSettings, SettingsKey } from './getGuildSetting';

import type { PrismaClient } from '@prisma/client';

export async function setGuildSetting<Setting extends keyof GuildSettings>(guildId: string, key: Setting, value: any) {
	const prisma = container.resolve<PrismaClient>(kPrisma);
	const data = await prisma.guilds.findFirst({
		where: {
			guild_id: guildId,
		},
	});

	if (!data) return;

	const rawKey = Reflect.get(SettingsKey, key) as Setting;

	const selectOptions = {};
	Reflect.set(selectOptions, rawKey, true);

	const dataOption = {};
	Reflect.set(dataOption, rawKey, value);

	await prisma.guilds.update({
		where: {
			id: data.id,
		},
		select: selectOptions,
		data: dataOption,
	});
}
