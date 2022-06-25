import { scrapePlayer } from '@toommyliu/realmeye-scraper';
import type { GuildMember } from 'discord.js';
import { VerificationType } from './verifyMember';

import { config } from '../../util/config';

const dungeonNames = ['Oryx Sanctuary', 'The Void', 'Cultist Hideout', 'The Nest', 'The Shatters', 'Fungal Cavern'];

// TODO: can be refactored better to return a consistent type
export async function checkEligibility(member: GuildMember, type: VerificationType) {
	if (type === VerificationType.Veteran) {
		const player = await scrapePlayer(member.displayName).catch(() => undefined);
		if (!player) return false;

		if (!player.dungeonCompletions) return false;

		const dungeonCompletions = [];

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (config.veteran_raiding.verification_requirements.dungeon_completions) {
			// start at 1, skipping o3s
			for (let i = 1; i < dungeonNames.length; ++i) {
				const dungeon = dungeonNames[i];
				const current = player.dungeonCompletions[dungeon];
				// TODO: refactor for { dungeonName: completion }
				const required = config.veteran_raiding.verification_requirements.dungeon_completions[i];
				if (required - current > 0)
					dungeonCompletions.push({
						dungeon,
						required,
						current,
						diff: required - current,
					});
			}

			if (dungeonCompletions.length) return dungeonCompletions;
		}

		return true;
	}
}
