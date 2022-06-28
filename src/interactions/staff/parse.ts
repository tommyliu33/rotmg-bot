import { ApplicationCommandOptionType, ChannelType } from 'discord-api-types/v10';

export default {
	name: 'parse',
	description: 'Parse usernames from /who screenshot',
	options: [
		{
			name: 'screenshot',
			description: 'The screenshot to parse',
			type: ApplicationCommandOptionType.Attachment,
			required: true,
		},
		{
			name: 'voice_channel',
			description: 'The voice channel to compare (defaults to your current voice channel)',
			type: ApplicationCommandOptionType.Channel,
			channel_types: [ChannelType.GuildVoice],
			required: false,
		},
	],
} as const;
