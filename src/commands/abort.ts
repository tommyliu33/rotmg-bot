import type { ChatInputCommandInteraction } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { RaidManager } from '../struct/RaidManager';
import { kRaids } from '../tokens';
import { abortRaid } from '#functions/raiding/abortRaid';
import type { Command } from '#struct/Command';

@injectable()
export default class implements Command {
	public constructor(@inject(kRaids) public readonly raidManager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const raid = this.raidManager.raids.get(`${interaction.guildId}-${interaction.member.id}`);
		if (raid) {
			await abortRaid(raid);
			await interaction.editReply({ content: 'Raid aborted.' });
			return;
		}

		await interaction.editReply('No raid found.');
	}
}
