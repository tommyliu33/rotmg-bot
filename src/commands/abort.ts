import type { Command } from '../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kRaids } from '../tokens';
import type { RaidManager } from '../struct/RaidManager';

@injectable()
export default class implements Command {
	public name = 'abort';
	public description = 'Abort your afkcheck or headcount';

	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });
		if (this.manager.afkchecks.has(`${interaction.guildId}-${interaction.member.id}`)) {
			this.manager.afkchecks.delete(`${interaction.guildId}-${interaction.member.id}`);
			await interaction.editReply({ content: 'Aborted your afkcheck.' });
			return;
		}

		await interaction.editReply({ content: 'No afkcheck found.' });
	}
}
