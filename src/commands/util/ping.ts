import type { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';

export default class implements Command<ApplicationCommandType.ChatInput> {
	public async handle(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply('pong.');
	}
}
