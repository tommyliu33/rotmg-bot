import "dotenv/config";
import "module-alias/register";

import { Bot, Database } from "@lib";
import { Stopwatch } from "@sapphire/stopwatch";
import { container } from "tsyringe";
import { kClient, kDatabase } from "./tokens";

const stopwatch = new Stopwatch();
async function init() {
  stopwatch.start();

  const client = new Bot();

  const db = new Database();
  await db.init();

  container.register(kDatabase, { useValue: db });
  container.register(kClient, { useValue: client });

  await client.login(process.env["discord_token"]!);

  client.once("ready", async () => {
    await client.initApplicationCommands({
      guild: { log: false },
    });
    console.log(`[stopwatch] :: took ${stopwatch.stop().toString()}`);
  });

  client.on("interactionCreate", async (interaction) => {
    await client.executeInteraction(interaction);
  });
}

init();
