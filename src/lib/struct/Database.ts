import camelcaseKeys from 'camelcase-keys';
import type { Client } from 'discord.js';
import { MongoClient, type Db, type Document } from 'mongodb';
import { inject, injectable } from 'tsyringe';
import { kClient } from '../../tokens';
import type { CamelCaseKeys } from '#util/util';

@injectable()
export class Database {
	private readonly db!: Db;
	public constructor(@inject(kClient) private readonly client: Client) {}

	public get guilds() {
		return this.db.collection<RawGuildDocument>('guilds');
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

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public get() {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public set() {}

	public async getSection<T extends SectionType>(guildId: string, section: T): Promise<CamelCaseKeys<RaidSection<T>>> {
		const doc = await this.getGuildDocument(guildId);
		const settings = camelcaseKeys(doc.sections[section], { deep: true });

		const res = camelcaseKeys(settings);
		return res as unknown as CamelCaseKeys<RaidSection<typeof section>>;
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

	public async getSections(guildId: string): Promise<CamelCaseKeys<RawGuildDocument['sections']> | undefined> {
		const doc = await this.getGuildDocument(guildId);
		return camelcaseKeys(doc.sections, { deep: true }) as unknown as CamelCaseKeys<RawGuildDocument['sections']>;
	}

	private async getGuildDocument(guildId: string): Promise<RawGuildDocument> {
		const doc = await this.guilds.findOne({ guild_id: guildId });
		return doc as unknown as RawGuildDocument;
	}
}

// #region guild

interface RawGuildDocument {
	guild_id: string;

	sections: {
		main: RaidSection<'main'>;
		veteran: RaidSection<'veteran'>;
	};
}

export type GuildDocument = CamelCaseKeys<RawGuildDocument>;

interface RaidSection<Veteran extends SectionType> {
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

interface VerificationRequirements {
	min_rank?: number;
	min_chars?: number;
	min_fame?: number;
	hidden_location?: boolean;
	verification_message?: string;
}

// TODO: maybe add typeguards or drop camel case keys
export type VerificationRequirementsCamel = CamelCaseKeys<VerificationRequirements>;
export type VeteranVeterificationRequirements = CamelCaseKeys<VeteranVerificationRequirements>;

export interface VeteranVerificationRequirements extends Pick<VerificationRequirements, 'verification_message'> {
	dungeon_completions: Record<DungeonNames, number>;
}

export type SectionType = 'main' | 'veteran';
type DungeonNames = 'o3' | 'void' | 'shatters' | 'cult' | 'nest' | 'fungal';

// #endregion

// #region user doc
type UserDocument = Document & { guild_id: string };
// #endregion
