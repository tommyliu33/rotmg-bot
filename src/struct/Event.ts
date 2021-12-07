export interface Event {
  name: string;
  execute(...args: unknown[]): void | Promise<void>;
}
