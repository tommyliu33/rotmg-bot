import type { GuildMember } from 'discord.js';
import { getGuildSetting } from '../settings/getGuildSetting';

export async function verifyMember(member: GuildMember, info: VerificationInfo) {
	const { guild } = member;

	const { userRole } = await getGuildSetting(guild.id, info.type);

	try {
		await member.roles.add(userRole);
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
