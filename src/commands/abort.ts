import { Inject } from '@ayanaware/bento';

import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandEntity } from '../components/CommandEntity';

import { CommandManager } from '../components/CommandManager';
import { RaidManager } from '../components/RaidManager';
import { Discord } from '#components/Discord';
import { abortRaid } from '#functions/raiding/abortRaid';

export default class implements CommandEntity {
	public name = 'commands:abort';
	public parent = CommandManager;

	@Inject(Discord) private readonly discord!: Discord;
	@Inject(RaidManager) private readonly raidManager!: RaidManager;

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const raid = this.raidManager.raids.get(`${interaction.guildId}-${interaction.member.id}`);
		if (raid) {
			await abortRaid.call({ raidManager: this.raidManager, discord: this.discord }, raid);
			await interaction.editReply({ content: 'Raid aborted.' });
			return;
		}

		await interaction.editReply('No raid found.');
	}
}
