import type { Events } from 'discord.js';

export interface Event {
	event: Values<typeof Events>;
	name: string;
	run: (...args: any[]) => Promise<void> | void;
}

type Values<T> = T[keyof T];
