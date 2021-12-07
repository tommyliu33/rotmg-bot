import type { Interaction } from "discord.js";
import type { Command, Event } from "@struct";

import { container } from "tsyringe";
import { logger } from "../logger";
import { kCommands } from "../tokens";

export default class implements Event {
  public name = "interactionCreate";

  public execute(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const commands = container.resolve<Map<string, Command>>(kCommands);

    const command = commands.get(commandName);

    if (command) {
      try {
        void command.execute(interaction);

        logger.info(
          `${interaction.user.tag} (${interaction.user.id}) ran an command: ${commandName}`
        );
      } catch (e) {
        const err = e as Error;
        logger.error(`Command error: ${err.stack ?? err.message}`);
      }
    }
  }
}
