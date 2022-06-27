import type { ChatInputCommandInteraction } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { kRaids } from '../tokens';
import type { Command } from '#struct/Command';
import { RaidType } from '#struct/Raid';
import type { RaidManager } from '#struct/RaidManager';

@injectable()
export default class implements Command {
	public name = 'abort';
	public description = 'Abort your afkcheck or headcount';

	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const key = `${interaction.guildId}-${interaction.member.id}`;

		const raid = this.manager.raids.get(key);
		if (raid) {
			await raid.abort();
			switch (raid.type) {
				case RaidType.Headcount:
					await interaction.editReply('Headcount aborted.');
					break;
				case RaidType.AfkCheck:
					await interaction.editReply('Afkcheck aborted.');
					break;
			}

			return;
		}

		await interaction.editReply({ content: 'No afkcheck or headcount found.' });
	}
}
