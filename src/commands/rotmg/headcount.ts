import type { Command, RaidManager } from '../../struct';
import type { CommandInteraction } from 'discord.js';

import { inject, injectable } from 'tsyringe';
import { kRaids } from '../../tokens';

import { dungeons } from '../../dungeons';

@injectable()
export default class implements Command {
	public name = 'headcount';
	public description = 'Start a headcount for the selected dungeon';

	public options = [
		{
			name: 'dungeon',
			description: 'Start a headcount for the selected dungeon',
			type: 3,
			choices: [
				{ name: 'Oryx Sanctuary', value: 'o3' },
				{ name: 'The Void', value: 'void' },
				{ name: 'The Shatters', value: 'shatters' },
				{ name: 'Cultist Hideout', value: 'cult' },
				{ name: 'The Nest', value: 'nest' },
				{ name: 'Fungal Cavern', value: 'fungal' },
			],
			required: true,
		},
	];

	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply();

		const dungeon = dungeons[dungeons.findIndex((d) => d.name === interaction.options.getString('dungeon'))];
		this.manager.emit('headcount', {
			dungeon,

			guildId: interaction.guildId,
			channelId: interaction.channelId,
			leaderId: interaction.user.id,

			messageId: '',
			controlPanelChannelId: '',
			controlPanelMessageId: '',
		});

		await interaction.deleteReply();
	}
}
