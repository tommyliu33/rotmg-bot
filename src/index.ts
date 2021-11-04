import "dotenv/config";
import "module-alias/register";

import { Bot, Database } from "@lib";
import { Stopwatch } from "@sapphire/stopwatch";
import { DIService } from "discordx";
import { container } from "tsyringe";
import { kClient, kDatabase } from "./tokens";

DIService.container = container;

const stopwatch = new Stopwatch();
async function init() {
  stopwatch.start();

  const client = new Bot();

  container.register(kDatabase, { useValue: Database });
  container.register(kClient, { useValue: client });

  await client.login(process.env["discord_token"]!);

  client.once("ready", async () => {
    await client.initApplicationCommands({
      guild: { log: true },
    });
    console.log(`[stopwatch] :: took ${stopwatch.stop().toString()}`);
    console.log("[bot] :: up");
  });

  client.on("interactionCreate", async (interaction) => {
    await client.executeInteraction(interaction);
  });
}

init();
