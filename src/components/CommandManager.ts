// @fs-entity
import { Component, ComponentAPI, Inject, Subscribe } from '@ayanaware/bento';
import { AutocompleteInteraction, BaseInteraction, Events, InteractionType } from 'discord.js';
import type { CommandEntity } from './CommandEntity';
import { Discord } from './Discord';

import { logger } from '#util/logger';

export class CommandManager implements Component {
	public name = 'command manager';
	public api!: ComponentAPI;

	@Inject(Discord) private readonly discord!: Discord;

	public readonly commands: Map<string, CommandEntity> = new Map();

	// eslint-disable-next-line @typescript-eslint/require-await
	public async onVerify() {
		logger.info('Registered commands');
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async onUnload() {
		this.commands.clear();
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async onChildLoad(entity: CommandEntity) {
		try {
			const name = this.getCommandName(entity);
			this.commands.set(name, entity);
		} catch (e) {
			const err = e as Error;
			logger.error(err);
		}
	}

	private getCommandName(entity: CommandEntity) {
		const chunk = entity.name.split(':');
		return chunk[chunk.length - 1];
	}

	@Subscribe(Discord, Events.InteractionCreate)
	private async handleInteractionCreate(interaction: BaseInteraction): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isChatInputCommand()) {
			const command = this.commands.get(interaction.commandName);
			try {
				await command?.run(interaction);
			} catch (e) {
				logger.error(e);
			}
		}

		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			// TODO: see if we can avoid castings
			const int_ = interaction as AutocompleteInteraction<'cached'>;

			const command = this.commands.get(int_.commandName);

			if (typeof command?.autocomplete !== 'function') return;

			try {
				await command.autocomplete(int_);
			} catch (e) {
				logger.error(e);
			}
		}
	}
}
