import { Collection } from 'discord.js';
import { Raid, type RaidBase } from './Raid';

export class Afkcheck extends Raid {
	public declare location: string;
	public locationRevealed: boolean;
	public reactions: Collection<string, ReactionStateUsers>;

	public constructor(data: Omit<RaidBase, 'mainMessageId'>) {
		super(data);

		this.isAfkCheck = () => true;

		this.location = '';
		this.locationRevealed = false;
		this.reactions = new Collection();
	}

	public getReaction(emojiId: string, state: ReactionState) {
		return this.reactions.get(emojiId)![state];
	}

	public addReaction(emojiId: string, userId: string, state: ReactionState) {
		this.getReaction(emojiId, state).add(userId);
	}

	public removeReaction(emojiId: string, userId: string, state: ReactionState) {
		this.getReaction(emojiId, state).delete(userId);
	}

	public userReacted(emojiId: string, userId: string, state: ReactionState) {
		return this.getReaction(emojiId, state).has(userId);
	}
}

type ReactionState = 'pending' | 'confirmed';
interface ReactionStateUsers {
	confirmed: Set<string>;
	pending: Set<string>;
}
