import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export default {
	name: 'realmeye',
	description: 'Search for a player or guild on Realmeye',
	options: [
		{
			name: 'guild',
			description: 'Search for a guild on Realmeye',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'guild',
					description: 'The name of the guild',
					type: ApplicationCommandOptionType.String,
					required: true
				}
			]
		},
		{
			name: 'player',
			description: 'Search for a player on Realmeye',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'player',
					description: 'The name of the player',
					type: ApplicationCommandOptionType.String,
					required: true
				}
			]
		}
	]
} as const;

