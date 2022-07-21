// @fs-entity
import { Component, ComponentAPI, Inject } from '@ayanaware/bento';
import { Discord } from './Discord';

import { logger } from '#util/logger';
import { GuildDocument, guilds } from '#util/mongo';

export class Database implements Component {
	public name = 'database helper';
	public api!: ComponentAPI;

	@Inject(Discord) private readonly discord!: Discord;

	private readonly cache: Map<string, GuildDocument> = new Map();

	// eslint-disable-next-line @typescript-eslint/require-await
	public async onVerify() {
		logger.info('[database] loaded');
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async onUnload() {
		this.cache.clear();
	}

	// TODO: getUser
	// getGuild

	public async get(guildId: string) {
		if (this.cache.has(guildId)) {
			return this.cache.get(guildId)!;
		}

		const guild = await guilds.findOne({ guild_id: guildId });
		if (guild) {
			this.cache.set(guildId, guild);
		}

		return guild as GuildDocument;
	}
}
