import { ApplicationCommandOptionType } from 'discord-api-types/v10';
export default {
	name: 'verify_message',
	description: 'Sends the verification message for a section',
	options: [
		{
			name: 'section',
			description: 'The section to use',
			type: ApplicationCommandOptionType.String,
			choices: [
				{
					name: 'Main Raiding',
					value: 'main_raiding',
				},
				{
					name: 'Veteran Raiding',
					value: 'veteran_raiding',
				},
			],
			required: true,
		},
		{
			name: 'button',
			description: 'The user must click on a button to start verification',
			type: ApplicationCommandOptionType.Boolean,
			required: false,
		}
	],
};
