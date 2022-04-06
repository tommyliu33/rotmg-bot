import { Collection } from '@discordjs/collection';
import { readFileSync } from 'node:fs';
import { parse } from '@ltd/j-toml';

import { logger } from '../../util/logger';
import * as constants from '../../constants';

import type { Afkcheck } from '#struct/Afkcheck';
import type { Headcount } from '#struct/Headcount';

const resolveEmoji = (emoji: string) => {
	if (emoji in constants) return Reflect.get(constants, emoji);
	return emoji;
};

export class RaidManager {
	public afkchecks: Collection<string, Afkcheck>;
	public headcounts: Collection<string, Headcount>;
	public dungeonCache: Collection<string, Dungeon>;

	public constructor() {
		this.afkchecks = new Collection();
		this.headcounts = new Collection();

		this.dungeonCache = new Collection();

		this.init();
	}

	public init() {
		const file = readFileSync('../data/dungeons.toml', { encoding: 'utf-8' });
		const file_ = parse(file, 1.0, '\n');

		for (const [key, dungeon] of Object.entries(file_)) {
			const dungeon_ = dungeon as unknown as Dungeon;

			const keys = dungeon_.keys.map((key) => ({
				emoji: resolveEmoji(key.emoji),
				max: Number(key.max) ?? 0,
			}));

			const main = dungeon_.main.map((key) => ({
				emoji: resolveEmoji(key.emoji),
				max: Number(key.max) ?? 0,
			}));

			this.dungeonCache.set(key, { ...dungeon_, keys, main, color: Number(dungeon_.color) });
		}

		logger.info('Cached dungeon data');
	}
}

export interface Dungeon {
	name: string;
	portal: string;
	keys: EmojiReaction[];

	main: EmojiReaction[];
	optional?: EmojiReaction[];

	color: number;
	images: string[];
}

interface EmojiReaction {
	emoji: string;
	max: number;
}
