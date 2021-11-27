import "dotenv/config";
import "module-alias/register";

import { Bot } from "@lib";
import { container } from "tsyringe";
import { kClient, kRedis, kPrisma } from "./tokens";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

async function init() {
  const redis = new Redis(process.env["REDIS_HOST"]);
  const prisma = new PrismaClient();
  await prisma.$connect();

  const client = new Bot();

  container.register(kClient, { useValue: client });
  container.register(kRedis, { useValue: redis });
  container.register(kPrisma, { useValue: prisma });

  await client.login(process.env["discord_token"]!);
}

init();
