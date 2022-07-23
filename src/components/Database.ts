// @fs-entity
import { Component, ComponentAPI, Inject } from '@ayanaware/bento';
import { MongoClient } from 'mongodb';
import { Discord } from './Discord';

import { logger } from '#util/logger';

export class Database implements Component {
	public name = 'Database';
	public api!: ComponentAPI;

	@Inject(Discord) private readonly discord!: Discord;

	private readonly mongoClient = new MongoClient(process.env.DATABASE_URL!);

	private readonly guildCache: Map<string, GuildDocument> = new Map();
	private readonly userCache: Map<string, UserDocument> = new Map();

	private get db() {
		return this.mongoClient.db('rotmg-bot');
	}

	private get guilds() {
		return this.db.collection<GuildDocument>('guilds');
	}

	private get users() {
		return this.db.collection<UserDocument>('users');
	}

	public async onVerify() {
		await this.mongoClient.connect();
		logger.info('Database connected');

		await this.createGuild('test');
	}

	public async onUnload() {
		await this.mongoClient.close();
		this.guildCache.clear();
		this.userCache.clear();
	}

	public async getGuild(guildId: string) {
		if (this.guildCache.has(guildId)) {
			return this.guildCache.get(guildId)!;
		}

		const guild = await this.guilds.findOne({ guild_id: guildId });
		if (guild) {
			this.guildCache.set(guildId, guild);
		}

		return guild as GuildDocument;
	}

	public async getUser(userId: string) {
		if (this.userCache.has(userId)) {
			return this.userCache.get(userId)!;
		}

		const user = await this.users.findOne({ user_id: userId });
		if (user) {
			this.userCache.set(userId, user);
		}

		return user as UserDocument;
	}

	private async createGuild(guildId: string) {
		const res = await this.guilds.insertOne({
			guild_id: guildId,
			main_raiding: {
				category_id: '',
				control_panel_channel_id: '',
				leader_role_id: '',
				status_channel_id: '',
				user_role_id: '',
				verification_channel_id: '',
				verification_requirements: {
					hidden_location: true,
					minimum_characters: 0,
					minimum_fame: 0,
					minimum_rank: 0,
					verification_message: '',
				},
				voice_channel_ids: ['', '', '', '', ''],
			},
			veteran_raiding: {
				category_id: '',
				control_panel_channel_id: '',
				leader_role_id: '',
				status_channel_id: '',
				user_role_id: '',
				verification_channel_id: '',
				verification_requirements: {
					dungeon_completions: [0, 0, 0, 0, 0, 0],
					verification_message: '',
				},
				voice_channel_ids: ['', '', '', '', ''],
			},
		});

		console.log(res);
	}

	private async createUser(userId: string) {
		const doc: UserDocument = { user_id: userId, guilds: [] };
		doc.guilds ??= this.discord.client.guilds.cache
			.filter((g) => g.members.cache.has(userId))
			.map((g) => ({
				guild_id: g.id,
				dungeon_completions: [0, 0, 0, 0, 0, 0],
			}));

		await this.users.insertOne(doc);
	}
}

export interface GuildDocument {
	guild_id: string;
	main_raiding: GuildConfigRaidSection & {
		verification_requirements: {
			hidden_location: boolean;
			minimum_characters: number;
			minimum_fame: number;
			minimum_rank: number;
		};
	};
	veteran_raiding: GuildConfigRaidSection & {
		verification_requirements: {
			dungeon_completions: number[];
		};
	};
}

interface GuildConfigRaidSection {
	category_id: string;
	control_panel_channel_id: string;
	status_channel_id: string;
	verification_channel_id: string;
	voice_channel_ids: string[];
	user_role_id: string;
	leader_role_id: string;
	verification_requirements: {
		verification_message: string;
	};
}

export interface UserDocument {
	user_id: string;
	guilds: UserGuildStats[];
}

interface UserGuildStats {
	guild_id: string;
	dungeon_completions: number[];
	names?: UserNameData[];
	verified_timestamp?: number;
	notes?: UserNote[];
}

interface UserNameData {
	name: string;
	verified_by?: string;
	verified_timestamp?: number;
}

interface UserNote {
	author: string;
	message: string;
	timestamp: number;
}
