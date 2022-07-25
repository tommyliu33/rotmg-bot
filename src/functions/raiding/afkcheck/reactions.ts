import { parseEmoji } from 'discord.js';
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

export function hasReactedState(raidInfo: Raid<true>, emojiId: string, userId: string, state: ReactionState) {
	return getReaction(raidInfo, emojiId, state).has(userId);
}

export function isReaction(raidInfo: Raid<true>, emojiId: string, primaryOnly = false) {
	const emojis = [
		parseEmoji(raidInfo.dungeon.portal)!.id,
		...raidInfo.dungeon.keys.map((k) => parseEmoji(k.emoji)!.id),
		...raidInfo.dungeon.main.map((k) => parseEmoji(k.emoji)!.id),
	];

	if (!primaryOnly && raidInfo.dungeon.optional) {
		emojis.push(...raidInfo.dungeon.optional.map((k) => parseEmoji(k.emoji)!.id));
	}

	return emojis.includes(emojiId);
}

type ReactionState = 'confirmed' | 'pending';
