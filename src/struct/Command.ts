import type { BaseCommandInteraction } from "discord.js";
import type { APIApplicationCommandOption } from "discord-api-types/v9";

export interface Command {
  name: string;
  description?: string;
  default_permission?: boolean;
  options?: APIApplicationCommandOption[];

  execute(interaction: BaseCommandInteraction): void | Promise<void>;
}
