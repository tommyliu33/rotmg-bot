import { Collection } from '@discordjs/collection';
import type { Afkcheck } from './Afkcheck';
import type { IHeadcount } from './Headcount';

import { readFileSync } from 'node:fs';
import { parse } from '@ltd/j-toml';

export class RaidManager {
	public afkchecks: Collection<string, Afkcheck>;
	public headcounts: Collection<string, IHeadcount>;
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
			this.dungeonCache.set(key, { ...dungeon_, color: Number(dungeon_.color) });
		}
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
	max?: number;
}
