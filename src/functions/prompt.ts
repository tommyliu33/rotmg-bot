import { inlineCode } from '@discordjs/builders';
import type { TextBasedChannelTypes } from '@sapphire/discord.js-utilities';
import type { AwaitMessagesOptions, Message } from 'discord.js';

import { stripIndents } from 'common-tags';

interface PromptResponses {
	question: string;
	response: string;
}

export async function prompt(
	channel: TextBasedChannelTypes,
	options: AwaitMessagesOptions,
	prompts: string[],
	responses: PromptResponses[] = [],
	message?: Message,
	index = 0
): Promise<PromptResponses[]> {
	let currentIndex = index;
	const expectedIndex = prompts.length;

	if (responses.length === expectedIndex) {
		await message?.delete().catch(() => undefined);
		return responses;
	}

	const question = prompts[currentIndex];

	let msg: Message;
	if (!message) {
		msg = await channel.send({
			content: stripIndents`
        ${question}
        You have 15 seconds to answer. Type ${inlineCode('cancel')} to abort.
      `,
		});
	}

	const collectedMessage = await channel.awaitMessages(options).catch(() => undefined);

	const msg_ = collectedMessage?.first();
	if (msg_?.content.toLowerCase() === 'cancel') {
		await msg!.edit({ content: 'Cancelling...' });
		await msg_.delete().catch(() => undefined);

		return responses;
	}

	responses.push({
		question,
		response: msg_?.content as string,
	});

	await msg_?.delete().catch(() => undefined);

	++currentIndex;
	if (!responses[expectedIndex]) {
		await prompt(channel, options, prompts, responses, msg!, currentIndex);
	}

	return responses;
}
