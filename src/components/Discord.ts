import { Component, ComponentAPI, Subscribe } from '@ayanaware/bento';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { logger } from '#util/logger';

export class Discord implements Component {
	public name = 'Discord';
	public api!: ComponentAPI;

	public client!: Client;

	// eslint-disable-next-line @typescript-eslint/require-await
	public async onUnload() {
		this.client.destroy();
		this.client.removeAllListeners();
	}

	public async onVerify() {
		return this.connect();
	}

	public async connect() {
		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildEmojisAndStickers,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.DirectMessageReactions,
				GatewayIntentBits.MessageContent,
			],
		});
		this.api.forwardEvents(this.client, Object.values(Events));

		await this.client.login();
	}

	@Subscribe(Discord, Events.ClientReady)
	private handleReady() {
		logger.info('Logged in');
	}
}
