import { BaseInteraction, Events } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { kCommands } from '../tokens';
import type { Command } from '#struct/Command';
import type { Event } from '#struct/Event';
import { logger } from '#util/logger';

@injectable()
export default class implements Event {
	public name = 'Interaction command handling';
	public event = Events.InteractionCreate;

	public constructor(@inject(kCommands) public readonly commands: Map<string, Command>) {}

	public async run(interaction: BaseInteraction) {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isChatInputCommand()) {
			const command = this.commands.get(interaction.commandName);

			try {
				await command?.run(interaction);
			} catch (e) {
				logger.error(e);
			}
		}

		if (interaction.isAutocomplete()) {
			const command = this.commands.get(interaction.commandName);
			if (typeof command?.autocomplete !== 'function') return;

			try {
				await command.autocomplete(interaction);
			} catch (e) {
				logger.error(e);
			}
		}
	}
}
