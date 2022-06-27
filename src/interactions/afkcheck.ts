import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export default {
	name: 'afkcheck',
	description: 'Start an afkcheck',
	options: [
		{
			name: 'voice_channel',
			description: 'The voice channel for this raid',
			type: ApplicationCommandOptionType.String,
			autocomplete: true,
			required: true,
		},
		{
			name: 'dungeon',
			description: 'The dungeon for this raid',
			type: ApplicationCommandOptionType.String,
			choices: [
				{ name: 'Oryx Sanctuary', value: 'o3' },
				{ name: 'The Void', value: 'void' },
				{ name: 'Fullskip Void', value: 'fsv' },
				{ name: 'The Shatters', value: 'shatters' },
				{ name: 'Cultist Hideout', value: 'cult' },
				{ name: 'The Nest', value: 'nest' },
				{ name: 'Fungal Cavern', value: 'fungal' },
			],
			required: true,
		},
	],
} as const;
