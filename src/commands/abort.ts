import { Inject } from '@ayanaware/bento';

import type { ChatInputCommandInteraction } from 'discord.js';
import type { CommandEntity } from '../components/CommandEntity';

import { CommandManager } from '../components/CommandManager';
import { RaidManager } from '../components/RaidManager';
import { abortRaid } from '#functions/raiding/abortRaid';

export default class implements CommandEntity {
	public name = 'commands:abort';
	public parent = CommandManager;

	@Inject(RaidManager) private readonly raidManager!: RaidManager;

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const raid = this.raidManager.raids.get(`${interaction.guildId}-${interaction.member.id}`);
		const raidFound = abortRaid.call({ raidManager: this.raidManager }, raid);

		const reply = raidFound ? 'Raid aborted.' : 'No raid found.';
		await interaction.editReply({ content: reply });
	}
}
