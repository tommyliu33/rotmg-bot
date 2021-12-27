import type { APIMessage } from 'discord-api-types/v9';
import type {
	AwaitMessageCollectorOptionsParams,
	ButtonInteraction,
	Client,
	CollectorFilter,
	Interaction,
	InteractionCollectorOptions,
	Message,
	MessageComponentInteraction,
	MessageComponentType,
	SelectMenuInteraction,
} from 'discord.js';

import { Constants, InteractionCollector } from 'discord.js'; // eslint-disable-line no-duplicate-imports
import { MessageComponentTypes } from 'discord.js/typings/enums';

// THANK GOD THEY REMOVED ALL THESE TYPES :)

type TaggedUnion<T, K extends keyof T, V extends T[K]> = T extends Record<K, V>
	? T
	: T extends Record<K, infer U>
	? V extends U
		? T
		: never
	: never;

type InteractionCollectorOptionsResolvable<Cached = boolean> =
	| MessageInteractionCollectorOptions<Cached>
	| SelectMenuInteractionCollectorOptions<Cached>
	| ButtonInteractionCollectorOptions<Cached>;

type MessageComponentCollectorOptions<T extends MessageComponentInteraction> = Omit<
	InteractionCollectorOptions<T>,
	'channel' | 'message' | 'guild' | 'interactionType'
>;

interface ButtonInteractionCollectorOptions<Cached = boolean>
	extends MessageComponentCollectorOptions<Cached extends true ? ButtonInteraction<'cached'> : ButtonInteraction> {
	componentType: 'BUTTON' | MessageComponentTypes.BUTTON;
}

interface SelectMenuInteractionCollectorOptions<Cached = boolean>
	extends MessageComponentCollectorOptions<
		Cached extends true ? SelectMenuInteraction<'cached'> : SelectMenuInteraction
	> {
	componentType: 'SELECT_MENU' | MessageComponentTypes.SELECT_MENU;
}

interface MessageInteractionCollectorOptions<Cached = boolean>
	extends MessageComponentCollectorOptions<
		Cached extends true ? MessageComponentInteraction<'cached'> : MessageComponentInteraction
	> {
	componentType: 'ACTION_ROW' | MessageComponentTypes.ACTION_ROW;
}
type CollectorOptionsTypeResolver<U extends InteractionCollectorOptionsResolvable<Cached>, Cached = boolean> = {
	readonly [T in U['componentType']]: TaggedUnion<U, 'componentType', T>;
};

type MappedInteractionCollectorOptions<Cached = boolean> = CollectorOptionsTypeResolver<
	InteractionCollectorOptionsResolvable<Cached>,
	Cached
>;

type InteractionExtractor<
	T extends MessageComponentType | MessageComponentTypes | undefined,
	C extends boolean = false
> = T extends MessageComponentType | MessageComponentTypes
	? MappedInteractionCollectorOptions<C>[T] extends InteractionCollectorOptions<infer Item>
		? Item
		: never
	: MessageComponentInteraction;

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
			// @ts-ignore
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
