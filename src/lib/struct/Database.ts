import type { Client } from 'discord.js';
import { MongoClient, type Db, type Document } from 'mongodb';
import { inject, injectable } from 'tsyringe';
import { kClient } from '../../tokens';

@injectable()
export class Database {
	private readonly db!: Db;
	public constructor(@inject(kClient) private readonly client: Client) {}

	public get guilds() {
		return this.db.collection<GuildDocument>('guilds');
	}

	public get users() {
		return this.db.collection<UserDocument>('users');
	}

	public async start() {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!this.db) {
			const client = new MongoClient(process.env.CONNECTION_STRING!);
			const db = client.db('rotmg');

			Object.defineProperty(this, 'db', { value: db });

			await client.connect();
		}

		return this.db;
	}

	public async getSection<T extends SectionType>(guildId: string, section: T) {
		const doc = await this.getGuildDocument(guildId);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		return doc.sections[section] || null;
	}

	public async updateSection<T extends SectionType, K extends keyof RaidSection<T>>(
		guildId: string,
		section: 'main' | 'veteran',
		key: K,
		value: unknown
	): Promise<RaidSection<T>> {
		const doc = await this.getGuildDocument(guildId);
		Reflect.set(doc.sections[section], key, value);
		return doc as unknown as RaidSection<typeof section>;
	}

	public async getSections(guildId: string) {
		const doc = await this.getGuildDocument(guildId);
		return doc;
	}

	private async getGuildDocument(guildId: string): Promise<GuildDocument> {
		const doc = await this.guilds.findOne({ guild_id: guildId });
		return doc as GuildDocument;
	}
}

// #region guild
export interface GuildDocument {
	guild_id: string;

	sections: {
		main: RaidSection<'main'>;
		veteran: RaidSection<'veteran'>;
	};
}

export interface RaidSection<Veteran extends SectionType> {
	category_id: string;
	status_channel_id: string;
	control_panel_channel_id: string;
	drag_channel_id: string;
	voice_channel_ids: string[];
	verification_channel_id: string;
	verification_requirements: Veteran extends 'veteran' ? VeteranVerificationRequirements : VerificationRequirements;
	user_role: string;
	leader_role: string;
}

export interface VerificationRequirements {
	min_rank?: number;
	min_chars?: number;
	min_fame?: number;
	hidden_location?: boolean;
	verification_message?: string;
}

export interface VeteranVerificationRequirements extends Pick<VerificationRequirements, 'verification_message'> {
	dungeon_completions: Record<DungeonNames, number>;
}

export type SectionType = 'main' | 'veteran';
export type DungeonNames = 'o3' | 'void' | 'shatters' | 'cult' | 'nest' | 'fungal';

// #endregion

// #region user doc
type UserDocument = Document & { guild_id: string };
// #endregion
