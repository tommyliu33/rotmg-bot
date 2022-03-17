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

		const key = `${interaction.guildId}-${interaction.member.id}`;

		const afkcheck = this.manager.afkchecks.get(key);
		const headcount = this.manager.headcounts.get(key);
		if (afkcheck) {
			await afkcheck.abort();
			this.manager.afkchecks.delete(key);

			await interaction.editReply({ content: 'Aborted your afkcheck.' });
			return;
		}

		if (headcount) {
			this.manager.headcounts.delete(key);

			await interaction.editReply({ content: 'Aborted your headcount.' });
			return;
		}

		await interaction.editReply({ content: 'No afkcheck or headcount found.' });
	}
}
