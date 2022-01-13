import type { CommandInteraction } from 'discord.js';
import type { Command } from '../../struct';

import { setGuildSetting, SettingsKey } from '../../functions';

export default class implements Command {
	public name = 'requirements';
	public description = 'Configure verification requirements for a section';

	public options = [
		{
			name: 'section',
			description: 'The section requirements to use',
			type: 3,
			choices: [
				{
					name: 'Main',
					value: 'main',
				},
				{
					name: 'Veteran',
					value: 'veteran',
				},
			],
			required: true,
		},
		{
			name: 'private_location',
			description: 'User requires private location to verify',
			type: 5,
		},
		{
			name: 'rank',
			description: 'Minimum account rank to verify',
			type: 4,
			min_value: 0,
			max_value: 90,
		},
		{
			name: 'o3',
			description: 'Minimum Oryx Sanctuary completes',
			type: 4,
		},
		{
			name: 'void',
			description: 'Minimum The Void completes',
			type: 4,
		},
		{
			name: 'shatters',
			description: 'Minimum The Shatters completes',
			type: 4,
		},
		{
			name: 'cult',
			description: 'Minimum Cultist Hideout completes',
			type: 4,
		},
		{
			name: 'nest',
			description: 'Minimum The Nest completes',
			type: 4,
		},
		{
			name: 'fungal',
			description: 'Minimum Fungal Cavern completes',
			type: 4,
		},
	];

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		const section = interaction.options.getString('section', true);

		const dungeons = interaction.options.data
			.filter((o) => !['section', 'private_loc', 'rank'].includes(o.name) && o.type === 'INTEGER')
			.map((c) => c.name);

		// This may be removed in the future
		if (section !== 'veteran' && ['o3', 'void', 'shatters', 'nest', 'fungal'].some((v) => dungeons.includes(v))) {
			await interaction.reply({ content: 'Dungeon requirements can only be used for Veteran verification.' });
			return;
		}

		if (section === 'main') {
			const options = interaction.options.data.filter((o) => ['private_location', 'rank'].includes(o.name));
			const keys = [SettingsKey.PrivateLocation, SettingsKey.Rank];

			// TODO: this doesnt work yet but will fix later

			// eslint-disable-next-line @typescript-eslint/prefer-for-of
			// @ts-expect-error
			for (let i = 0; i < options.length; ++i) await setGuildSetting(interaction.guildId, keys[i], options[i].value);
		}

		await interaction.reply('hello world');
	}
}
