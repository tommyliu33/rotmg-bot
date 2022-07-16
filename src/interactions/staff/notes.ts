import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export default {
	name: 'notes',
	description: 'User notes',
	options: [
		{
			name: 'create',
			description: 'Create a note',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user',
					description: 'The user for this note',
					type: ApplicationCommandOptionType.User,
					required: true,
				},
				{
					name: 'message',
					description: 'The message for this note',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: 'view',
			description: 'View a note',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user',
					description: 'The notes belonging to this user',
					type: ApplicationCommandOptionType.User,
					required: true,
				},
			],
		},
	],
} as const;
