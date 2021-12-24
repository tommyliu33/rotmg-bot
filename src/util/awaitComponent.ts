import type { APIMessage } from 'discord-api-types/v9';
import type {
	AwaitMessageCollectorOptionsParams,
	Client,
	CollectorFilter,
	Interaction,
	InteractionExtractor,
	Message,
	MessageComponentType,
} from 'discord.js';

import { Constants, InteractionCollector } from 'discord.js'; // eslint-disable-line no-duplicate-imports

/*
  Most of this code is adapted from TextBasedChannel#awaitMessageComponent
  to support a message of type APIMessage, which Message#awaitMessageComponent doesn't accept...

  Had to look at discord.js typings to figure it out but it works :c
*/

export async function awaitComponent<
	T extends MessageComponentType | keyof typeof Constants.MessageComponentTypes = 'ACTION_ROW'
>(
	client: Client,
	message: Message | APIMessage,
	options: AwaitMessageCollectorOptionsParams<T> = {}
): Promise<InteractionExtractor<T> | undefined> {
	return new Promise((resolve, reject) => {
		const collector = new InteractionCollector(client, {
			...(options as CollectorFilter<[Interaction<'cached'>]>),
			message,
			max: 1,
			interactionType: Constants.InteractionTypes.MESSAGE_COMPONENT,
		});

		collector.once('end', (interactions, reason) => {
			const interaction = interactions.first();
			if (interaction) resolve(interaction as InteractionExtractor<T>);
			else reject(new Error(reason));
		});
	});
}
