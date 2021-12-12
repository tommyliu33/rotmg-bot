import type { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9";
import type { Command } from "../struct/Command";

import { container } from "tsyringe";
import { kCommands } from "../tokens";

export function getInteractions(): RESTPostAPIApplicationCommandsJSONBody[] {
  const commands = container.resolve<Map<string, Command>>(kCommands);

  const interactions = [];
  for (const {
    name,
    description = name,
    options = [],
    default_permission = true,
  } of commands.values()) {
    interactions.push({ name, description, options, default_permission });
  }

  return interactions;
}
