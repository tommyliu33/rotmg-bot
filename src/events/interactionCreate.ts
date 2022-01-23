import type { Event } from '../Event';
import type { Interaction } from 'discord.js';

import type { Command } from '../Command';

import { injectable, inject } from 'tsyringe';
import { kCommands } from '../tokens';

import { logger } from '../util/logger';

@injectable()
export default class implements Event {
	public name = 'interactionCreate';

	public constructor(@inject(kCommands) public commands: Map<string, Command>) {}

	public async execute(interaction: Interaction) {
		if (interaction.isCommand()) {
			const command = this.commands.get(interaction.commandName);

			try {
				await command?.execute(interaction);
				logger.info(`${interaction.user.tag} (${interaction.user.id}) ran a command: ${interaction.toString()}`);
			} catch (e) {
				logger.error(e);
			}
		}
	}
}
