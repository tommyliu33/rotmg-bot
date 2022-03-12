import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction, Client, Message } from 'discord.js';

import { Type } from '@sapphire/type';
import { isThenable } from '@sapphire/utilities';
import { inspect } from 'node:util';
import { codeBlock } from '@discordjs/builders';

import { inject, injectable } from 'tsyringe';
import { kClient, kRaids } from '../../tokens';
import type { RaidManager } from '../../struct/RaidManager';

@injectable()
export default class implements Command {
	public name = 'eval';
	public description = 'eval stuff';

	public constructor(
		@inject(kRaids) public readonly manager: RaidManager,
		@inject(kClient) public readonly client: Client
	) {}

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;
		await interaction.deferReply();
		if (interaction.user.id !== '299612138924670978') return;

		const m = await interaction.channel?.send('code');

		const collector = await interaction.channel
			?.awaitMessages({
				filter: (m) => m.author.id === interaction.user.id,
				max: 1,
			})
			.catch(() => {
				void interaction.editReply('no');
				void m?.delete();
				return undefined;
			});
		if (collector?.first()) {
			await m?.delete();
			const msg = collector.first();
			const res = await this.eval(msg!, msg!.content);
			if (res.result.length > 2000) {
				await interaction.editReply({
					content: 'too long',
					files: [{ attachment: Buffer.from(res.result), name: 'output.js' }],
				});
			} else {
				await interaction.editReply({
					embeds: [
						{
							description: codeBlock('js', res.result),
							footer: {
								text: res.type,
							},
						},
					],
				});
			}
		}
	}

	public async eval(message: Message, code: string) {
		if (code.includes('await')) {
			code = `(async () => {\n${code}\n})();`;
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const msg = message;

		let success = true;
		let result = null;

		try {
			// eslint-disable-next-line
			result = eval(code);
		} catch (error) {
			if (error && error instanceof Error && error.stack) {
				console.log(error);
			}
			result = error;
			success = false;
		}

		const type: string = new Type(result).toString();
		if (isThenable(result)) result = await result;

		if (typeof result !== 'string') {
			result = inspect(result, {});
		}

		return { result, success, type };
	}
}
