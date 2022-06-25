import { readFileSync } from 'node:fs';
import { Collection } from '@discordjs/collection';
import { parse } from '@ltd/j-toml';

import * as constants from '../../constants';
import { logger } from '../../util/logger';

import type { Raid } from '#struct/Raid';

const resolveEmoji = (emoji: string) => {
	if (emoji in constants) return Reflect.get(constants, emoji) as string;
	return emoji;
};

export class RaidManager {
	public raids: Collection<string, Raid>;
	public dungeonCache: Collection<string, Dungeon>;

	public constructor() {
		this.raids = new Collection();
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
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				max: Number(key.max) ?? 0,
			}));

			const main = dungeon_.main.map((key) => ({
				emoji: resolveEmoji(key.emoji),
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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

export interface EmojiReaction {
	emoji: string;
	max: number;
}
