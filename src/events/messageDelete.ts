import { Events, Message } from 'discord.js';
import type { Event } from '#struct/Event';

export const messageCache = new Set<string>();

export default class implements Event {
	public name = 'Message deletions';
	public event = Events.MessageDelete;

	public run(msg: Message) {
		if (msg.guild) messageCache.add(msg.id);
	}
}
