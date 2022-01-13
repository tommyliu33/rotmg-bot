import type { PrismaClient } from '.prisma/client';
import type { Snowflake } from 'discord-api-types';
import type { Client } from 'discord.js';

import { container } from 'tsyringe';
import { kClient, kPrisma } from '../../tokens';
import { getGuildSetting } from '../';

// TODO: Cleanup
export async function verify(guildId: Snowflake, userId: Snowflake, name: string) {
	const client = container.resolve<Client<true>>(kClient);
	const prisma = container.resolve<PrismaClient>(kPrisma);

	const guild = await client.guilds.fetch(guildId)!;
	const member = await guild.members.fetch(userId)!;

	const roleId = await getGuildSetting(guildId, 'VerifiedRole');

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
				stats: [],
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

	const { manageable, roles } = member;
	if (!manageable || !guild.me?.permissions.has('MANAGE_NICKNAMES')) return;

	const nick = names.length === 1 ? names[0] : names.join(' | ');
	await member.setNickname(nick).catch(() => {
		return undefined;
	});

	if (!roles.cache.has(roleId)) {
		await roles.add(roleId).catch(() => {
			return undefined;
		});
	}
}
