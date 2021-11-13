import "dotenv/config";
import "module-alias/register";

import { Bot, Database } from "@lib";
import { container } from "tsyringe";
import { kClient, kDatabase, kRedis } from "./tokens";
import Redis from "ioredis";

async function init() {
  const redis = new Redis(process.env["REDIS_HOST"]);

  const client = new Bot();

  const db = new Database();
  await db.init();

  container.register(kClient, { useValue: client });
  container.register(kDatabase, { useValue: db });
  container.register(kRedis, { useValue: redis });

  await client.login(process.env["discord_token"]!);
}

init();
