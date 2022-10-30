import 'reflect-metadata';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { Client, GatewayIntentBits, type ClientEvents } from 'discord.js';
import readdirp from 'readdirp';
import { container, type InjectionToken } from 'tsyringe';
import { type Command, commandInfo } from './struct/Command.js';
import { type Event, eventInfo } from './struct/Event.js';
import { logger } from './util/logger.js';
import { kClient, kCommands } from './util/tokens.js';

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});
const commands = new Map<string, Command>();

container.register(kClient, { useValue: client });
container.register(kCommands, { useValue: commands });

void (async () => {
	const commandFiles = readdirp(fileURLToPath(new URL('commands', import.meta.url)), {
		fileFilter: '*.js',
	});
	for await (const file of commandFiles) {
		const commandMod = (await import(file.fullPath)) as { default: InjectionToken<Command> };
		const command = container.resolve(commandMod.default);

		const cmdInfo = commandInfo(file.fullPath);
		if (!cmdInfo) {
			continue;
		}

		commands.set(cmdInfo.name, command);
		logger.info(`Registered commmand: ${cmdInfo.name}`);
	}

	const eventFiles = readdirp(fileURLToPath(new URL('events', import.meta.url)), {
		fileFilter: '*.js',
	});
	for await (const file of eventFiles) {
		const eventMod = (await import(file.fullPath)) as { default: InjectionToken<Event> };
		const event = container.resolve(eventMod.default);

		const eventInfo_ = eventInfo(file.fullPath);
		if (!eventInfo_) {
			continue;
		}

		const name = event.name ?? (eventInfo_.name as keyof ClientEvents);
		// @ts-expect-error #2772
		client.on(name, (...args) => event.handle(...args));
		logger.info(`Registered event: ${name}`);
	}

	await client.login(process.env.DISCORD_TOKEN);
})();
