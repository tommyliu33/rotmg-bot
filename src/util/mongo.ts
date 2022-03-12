import { MongoClient, type Document } from 'mongodb';

export interface GuildDocument extends Document {
	guild_id: string;

	main_section: {
		id: string;
		afk_check_channel_id: string;
		verification_channel_id: string;
		control_panel_channel_id: string;
		voice_channel_ids: string[];
		user_role: string;
		leader_role: string;
	};

	veteran_section: {
		id: string;
		afk_check_channel_id: string;
		verification_channel_id: string;
		control_panel_channel_id: string;
		voice_channel_ids: string[];
		user_role: string;
		leader_role: string;
	};
}

const client = new MongoClient(process.env.CONNECTION_STRING!);
const db = client.db('rotmg');

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
export const guilds = db.collection<GuildDocument>('guilds');

await client.connect();
await guilds.createIndex({ name: 1 }, { unique: true });
