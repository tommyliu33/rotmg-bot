import "dotenv/config";
import "module-alias/register";

import { Bot, Database } from "@lib";
import { container } from "tsyringe";
import { kClient, kDatabase } from "./tokens";
import { Interaction } from "discord.js";

async function init() {
  const client = new Bot();

  const db = new Database();
  await db.init();

  container.register(kDatabase, { useValue: db });
  container.register(kClient, { useValue: client });

  await client.login(process.env["discord_token"]!);
}

init();
