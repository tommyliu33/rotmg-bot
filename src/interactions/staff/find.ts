import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export default {
	name: 'find',
	description: 'Find a member with a specifier',
	options: [
		{
			name: 'name',
			description: 'Specifier to search for',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: 'hide',
			description: 'Hides command output to other members',
			type: ApplicationCommandOptionType.Boolean,
			required: false,
		},
	],
} as const;
