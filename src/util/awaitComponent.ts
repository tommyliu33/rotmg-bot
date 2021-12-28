import type { APIMessage } from 'discord-api-types/v9';
import type {
	AwaitMessageCollectorOptionsParams,
	Client,
	CollectorFilter,
	Interaction,
	MappedInteractionTypes,
	Message,
	MessageComponentType,
} from 'discord.js';

import { Constants, InteractionCollector } from 'discord.js'; // eslint-disable-line no-duplicate-imports

export async function awaitComponent<
	T extends MessageComponentType | keyof typeof Constants.MessageComponentTypes = 'ACTION_ROW'
>(
	client: Client,
	message: Message | APIMessage,
	options: AwaitMessageCollectorOptionsParams<T> = {}
): Promise<MappedInteractionTypes[T] | undefined> {
	return new Promise((resolve, reject) => {
		const collector = new InteractionCollector(client, {
			...(options as CollectorFilter<[Interaction<'cached'>]>),
			// @ts-ignore
			message,
			max: 1,
			interactionType: Constants.InteractionTypes.MESSAGE_COMPONENT,
		});

		collector.once('end', (interactions, reason) => {
			const interaction = interactions.first();
			if (interaction) resolve(interaction as MappedInteractionTypes[T]);
			else reject(new Error(reason));
		});
	});
}
