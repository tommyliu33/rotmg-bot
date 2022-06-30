import type { GuildMember } from 'discord.js';

export async function verifyMember(member: GuildMember, info: Omit<VerificationInfo, 'type'>): Promise<void> {
	await member.roles
		.add(info.roleId)
		.catch(() => new Error('Failed to add the role to this user. You may have to add the role manually.'));

	if (info.nickname) {
		await member
			.setNickname(info.nickname)
			.catch(() => new Error("Failed to update this users' nickname. You may have to update their nickname manually."));
	}
}

export interface VerificationInfo {
	nickname?: string;
	roleId: string;
	type: VerificationType;
}

export enum VerificationType {
	Main = 'main',
	Veteran = 'veteran',
}
