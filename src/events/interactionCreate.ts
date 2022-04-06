import type { Event } from '#struct/Event';
import type { Command } from '#struct/Command';
import { Events, Interaction } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kCommands } from '../tokens';

import { logger } from '../util/logger';

@injectable()
export default class implements Event {
	public name = 'Interaction handling';
	public event = Events.InteractionCreate;

	public constructor(@inject(kCommands) public readonly commands: Map<string, Command>) {}

	public async run(interaction: Interaction) {
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
