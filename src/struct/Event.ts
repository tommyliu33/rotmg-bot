export interface Event {
	name: string;
	emitter: string;

	execute(...args: unknown[]): void | Promise<void>;
}
