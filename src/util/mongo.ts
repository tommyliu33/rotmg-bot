import { MongoClient, type WithId } from 'mongodb';

const DATABASE_NAME = 'rotmg' as const;
const GUILDS_COLLECTION = 'guilds' as const;
const USERS_COLLECTION = 'users' as const;

export const mongo = new MongoClient(process.env.DATABASE_URL!);
export const db = mongo.db(DATABASE_NAME);
export const guilds = db.collection<GuildDocument>(GUILDS_COLLECTION);
export const users = db.collection<UserDocument>(USERS_COLLECTION);

// TODO: we can cache guild docs and update the cache as they are updated
void mongo.connect();

export async function createUser(userId: string) {
	const user = await users.findOne({ user_id: userId });
	if (user) {
		return user;
	}

	void users.insertOne({ guilds: [], user_id: userId });
	return users.findOne({ user_id: userId }) as Promise<WithId<UserDocument>>;
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

interface UserDocument {
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
