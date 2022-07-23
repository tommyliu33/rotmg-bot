import type { Raid } from '../startRaid';

export function getReaction(raidInfo: Raid<true>, emojiId: string, state: ReactionState) {
	return raidInfo.reactions.get(emojiId)![state];
}

export function addReaction(raidInfo: Raid<true>, emojiId: string, userId: string, state: ReactionState) {
	getReaction(raidInfo, emojiId, state).add(userId);
}

export function removeReaction(raidInfo: Raid<true>, emojiId: string, userId: string, state: ReactionState) {
	getReaction(raidInfo, emojiId, state).delete(userId);
}

export function hasReacted(raidInfo: Raid<true>, emojiId: string, userId: string, state: ReactionState) {
	return getReaction(raidInfo, emojiId, state).has(userId);
}

type ReactionState = 'confirmed' | 'pending';
