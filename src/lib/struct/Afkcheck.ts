import { Collection } from 'discord.js';
import { Headcount, type RaidBase } from './Headcount';

export class Afkcheck extends Headcount {
	public declare location: string;
	public locationRevealed: boolean;
	public reactions: Collection<string, ReactionStateUsers>;

	public constructor(data: Omit<RaidBase, 'messageId'>) {
		super(data);

		this.type = 'Raid';

		this.location = '';
		this.locationRevealed = false;
		this.reactions = new Collection();
	}

	public addReaction(emojiId: string, userId: string, state: ReactionState) {
		this.reactions.get(emojiId)![state].add(userId);
	}

	public removeReaction(emojiId: string, userId: string, state: ReactionState) {
		this.reactions.get(emojiId)![state].delete(userId);
	}

	public getReaction(emojiId: string, state: ReactionState) {
		return this.reactions.get(emojiId)![state];
	}

	public userReacted(emojiId: string, userId: string, state: ReactionState) {
		return this.reactions.get(emojiId)![state].has(userId);
	}
}

type ReactionState = 'pending' | 'confirmed';
interface ReactionStateUsers {
	confirmed: Set<string>;
	pending: Set<string>;
}
