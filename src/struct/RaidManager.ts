import { Collection } from '@discordjs/collection';
import type { Afkcheck } from './Afkcheck';
import type { Headcount } from './Headcount';

import { readFileSync } from 'node:fs';
import { parse } from '@ltd/j-toml';

import { logger } from '../util/logger';
import * as constants from '../constants';

export class RaidManager {
	public afkchecks: Collection<string, Afkcheck>;
	public headcounts: Collection<string, Headcount>;
	public dungeonCache: Collection<string, Dungeon>;

	public constructor() {
		this.afkchecks = new Collection();
		this.headcounts = new Collection();

		this.dungeonCache = new Collection();
	}

	public init() {
		const file = readFileSync('../data/dungeons.toml', { encoding: 'utf-8' });
		const file_ = parse(file, 1.0, '\n');

		for (const [key, dungeon] of Object.entries(file_)) {
			if (key !== 'o3') continue;
			const dungeon_ = dungeon as unknown as Dungeon;

			const keys = dungeon_.keys.map((key) => ({
				emoji: this.resolveEmojiFromConstants(key.emoji),
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				max: Number(key.max) ?? 0,
			}));

			const main = dungeon_.main.map((key) => ({
				emoji: this.resolveEmojiFromConstants(key.emoji),
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				max: Number(key.max) ?? 0,
			}));

			this.dungeonCache.set(key, { ...dungeon_, keys, main, color: Number(dungeon_.color) });
		}

		logger.info('Cached dungeon data');
	}

	private resolveEmojiFromConstants(emojiName: string) {
		if (emojiName in constants) return Reflect.get(constants, emojiName) as string;
		return '';
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
