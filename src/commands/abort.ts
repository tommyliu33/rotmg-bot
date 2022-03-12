import type { Command } from '../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kRaids } from '../tokens';
import type { RaidManager } from '../struct/RaidManager';

@injectable()
export default class implements Command {
	public name = 'abort';
	public description = 'abort an afkcheck';

	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });
		if (this.manager.afkchecks.has(interaction.user.id)) {
			// await this.manager.raids.get(interaction.user.id)?.abort();
			await interaction.editReply({ content: 'Aborted your afkcheck.' });
			return;
		}

		await interaction.editReply({ content: 'No afkcheck found.' });
	}
}
