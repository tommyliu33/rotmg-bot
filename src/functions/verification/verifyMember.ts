import type { GuildMember } from 'discord.js';
import { container } from 'tsyringe';
import { kDatabase } from '../../tokens';
import type { Database } from '#struct/Database';

export async function verifyMember(member: GuildMember, info: VerificationInfo): Promise<void> {
	const db = container.resolve<Database>(kDatabase);

	const { guild } = member;
	const { user_role } = await db.getSection(guild.id, info.type);

	try {
		await member.roles.add(user_role);
		if (info.nickname) await member.setNickname(info.nickname);
	} catch {}
}

export interface VerificationInfo {
	type: VerificationType;
	roleId: string;
	nickname?: string;
}

export enum VerificationType {
	Main = 'main',
	Veteran = 'veteran',
}
