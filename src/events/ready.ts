import type { Bot, Event } from "@struct";

import { getInteractions } from "@util";
import { container } from "tsyringe";
import { logger } from "../logger";
import { kClient } from "../tokens";

export default class implements Event {
  public name = "ready";

  public async execute() {
    logger.info("Logged in");

    const client = container.resolve<Bot>(kClient);
    const app = await client.application?.fetch();

    const guilds = await client.guilds.fetch();

    for (const guild of guilds.values()) {
      await app?.commands.set(await getInteractions(), guild.id);

      logger.info(
        `Updated application commands for ${guild.name} (${guild.id})`
      );
    }
  }
}
