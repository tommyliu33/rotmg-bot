import { GatewayIntentBits } from 'discord-api-types/v9';

import { ButtonStyle, UnsafeButtonComponent } from 'discord.js';

export const ClientIntents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.DirectMessageReactions,
] as const;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Buttons {
	public static crashersButton = new UnsafeButtonComponent()
		.setCustomId('view_crashers')
		.setStyle(ButtonStyle.Primary)
		.setLabel('View crashers')
		.setEmoji({
			name: '🕵️',
		});
}
