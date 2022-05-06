import { MessageType } from 'discord-api-types/v10';
import { Events, Message } from 'discord.js';
import type { Event } from '#struct/Event';

export default class implements Event {
	public name = 'Message creation';
	public event = Events.MessageCreate;

	public run(msg: Message) {
		if (msg.author.id === msg.client.user!.id && msg.type === MessageType.ChannelPinnedMessage)
			void msg.delete().catch(() => undefined);
	}
}
