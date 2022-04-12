import { MongoClient, type Document } from 'mongodb';
import type { Settings } from '../functions/settings/getGuildSetting';

const client = new MongoClient(process.env.CONNECTION_STRING!);
const db = client.db('rotmg');

export const guilds = db.collection<GuildDocument>('guilds');
export const users = db.collection<UserDocument>('users');

await client.connect();

type GuildDocument = Settings & Document & { guild_id: string };
type UserDocument = Document & { guild_id: string };
