export interface Event {
	name: string;
	execute(...args: unknown[]): Promise<void> | void; // eslint-disable-line @typescript-eslint/method-signature-style
}
