import type { Client } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { kClient } from '../../tokens';

import { MongoClient, type Db, type Document } from 'mongodb';
import type { Settings } from '#functions/settings/getGuildSetting';

@injectable()
export class Database {
	private readonly db!: Db;
	public constructor(@inject(kClient) public readonly client: Client) {}

	public async start() {
		const client = new MongoClient(process.env.CONNECTION_STRING!);
		const db = client.db('rotmg');

		Object.defineProperty(this, 'db', { value: db });

		await client.connect();
	}

	public get guilds() {
		return this.db.collection<GuildDocument>('guilds');
	}

	public get users() {
		return this.db.collection<UserDocument>('users');
	}
}

type GuildDocument = Settings & Document & { guild_id: string };
type UserDocument = Document & { guild_id: string };
