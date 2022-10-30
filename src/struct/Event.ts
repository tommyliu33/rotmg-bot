import { basename, extname } from 'node:path';
import type { ClientEvents } from 'discord.js';

export type Event<T extends keyof ClientEvents = keyof ClientEvents> = {
	handle(...args: ClientEvents[T]): Awaited<unknown>;
	readonly name?: T;
};

export type EventInfo = {
	name: string;
};

export function eventInfo(path: string): EventInfo | null {
	if (extname(path) !== '.js') {
		return null;
	}

	return { name: basename(path, '.js') };
}
