import type { APIApplicationCommandOption } from "discord-api-types/v9";
import type { Class } from "type-fest";
import type { CommandContext } from "./CommandContext";

interface CommandOptions {
  name: string;
  description: string;
  options?: APIApplicationCommandOption[];
}

export function command(data: CommandOptions) {
  return (target: Class<Command>) => {
    return class extends target {
      constructor(...args: any[]) {
        super(data, ...args);
      }
    };
  };
}

export class Command {
  public readonly name: string;
  public readonly description: string;
  public readonly options: APIApplicationCommandOption[];

  public constructor(data: CommandOptions) {
    this.name = data.name;
    this.description = data.description ??= "";
    this.options = data.options ??= [];
  }

  public exec(ctx: CommandContext): any {
    void [ctx];
  }
}
