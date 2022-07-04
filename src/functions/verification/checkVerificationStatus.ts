import { scrapePlayer, isGraveyardAvailable } from '@toommyliu/realmeye-scraper';
import type { GuildMember } from 'discord.js';
import { VerificationType } from './verifyMember';

import { guilds } from '#util/mongo';

const DUNGEON_NAMES = [
	'Oryx Sanctuary',
	'The Void',
	'Cultist Hideout',
	'The Nest',
	'The Shatters',
	'Crystal Cavern',
] as const;

export enum VerificationStatusCode {
	Ignore,
	Failed,
	Missing,

	SetName,
	AddRole,
}

export async function checkVerificationStatus<T extends VerificationType>(
	member: GuildMember,
	type: VerificationType
): Promise<VerificationStatus<T>> {
	const res: VerificationStatus<typeof type> = Object.create({}) as VerificationStatus<typeof type>;

	switch (type) {
		case VerificationType.Main:
			break;
		case VerificationType.Veteran:
			const doc = await guilds.findOne({ guild_id: member.guild.id });
			const player = await scrapePlayer(member.displayName).catch(() => undefined);

			if (!player || !doc) {
				res.status = VerificationStatusCode.Failed;
			}

			if (player?.dungeonCompletions) {
				if (!isGraveyardAvailable(player)) {
					res.status = VerificationStatusCode.Failed;
				}

				if (![VerificationStatusCode.Failed, VerificationStatusCode.Ignore].includes(res.status)) {
					// @ts-expect-error
					res.dungeonCompletions = {};

					let failed = false;
					let count = 0;

					for (let i = 1; i < DUNGEON_NAMES.length; ++i) {
						const dungeon = DUNGEON_NAMES[i];
						const current = player.dungeonCompletions[dungeon];
						const required = doc!['veteran_raiding']['verification_requirements']['dungeon_completions'][i];
						const missing = required - current;

						if (!failed && missing > 0) {
							failed = true;
							res.status = VerificationStatusCode.Missing;
						}

						if (missing < 0) {
							count += 1;
							if (count === 5) {
								res.status = VerificationStatusCode.AddRole;
							}
						}

						res.dungeonCompletions[dungeon] = {
							dungeonName: dungeon,
							current,
							required,
							missing,
						};
					}
				}
			}
	}

	// @ts-expect-error
	return res;
}

type VerificationStatus<T extends VerificationType> = {
	status: VerificationStatusCode;
	type: T;
} & (T extends VerificationType.Veteran ? { dungeonCompletions: DungeonCompletions } : Record<string, never>);

type DungeonCompletions = {
	[key in DungeonNames]: {
		dungeonName: string;
		required: number;
		current: number;
		missing: number;
	};
};

type DungeonNames = 'Oryx Sanctuary' | 'The Void' | 'The Shatters' | 'Cultist Hideout' | 'The Nest' | 'Crystal Cavern';
