import { container } from 'tsyringe';
import { kClient } from '../../tokens';

import { CaseType, getGuildSetting, setGuildSetting } from '..';
import { nanoid } from 'nanoid';

import type { Client } from 'discord.js';

export interface Case {
	action: CaseType;
	actionProcessed: boolean;

	guildId: string;
	userId: string;

	moderatorId: string;

	roles?: string[];
	reason: string;

	date: string;
	duration: string;

	logChannelId: string;
}

export async function createCase(guildId: string, case_: Case) {
	const client = container.resolve<Client<true>>(kClient);

	const guild = await client.guilds.fetch(guildId).catch(() => undefined);
	if (!guild) return;

	const roles: string[] = [];

	switch (case_.action) {
		case CaseType.Suspension:
			const roleId = await getGuildSetting(guildId, 'SuspendRole');
			if (!roleId) return;

			const member = guild.members.cache.get(case_.userId)!;
			roles.push(
				...member.roles.cache.filter((c) => c.id !== guild.roles.everyone.id && c.id !== roleId).map((c) => c.id)
			);

			await member.roles.set([roleId]).catch(() => undefined);
			break;
		case CaseType.SuspensionEnd:
			break;
		case CaseType.Timeout:
			break;
		case CaseType.TimeoutEnd:
			break;
		case CaseType.Warn:
			break;
		case CaseType.Kick:
			break;
		case CaseType.Ban:
			break;
		case CaseType.Unban:
			break;
	}

	const currentCases = await getGuildSetting(guildId, 'Cases');

	const rawCase = {
		action: case_.action,
		action_processed: false,
		guild_id: case_.guildId,
		user_id: case_.userId,
		moderator_id: case_.moderatorId,
		reason: case_.reason,
		case_id: nanoid(6),
		date: new Date().toString(),
		duration: case_.duration,
	};

	if (roles.length) Reflect.set(rawCase, 'roles', roles);

	await setGuildSetting(guildId, 'Cases', [...currentCases, rawCase]);
}
