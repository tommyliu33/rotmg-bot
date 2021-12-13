import "reflect-metadata";

import "dotenv/config";
import "module-alias/register";

import { Bot } from "./struct/Bot";
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";
import type { Event, Command } from "@struct"; // eslint-disable-line no-duplicate-imports

import readdirp from "readdirp";

import { container } from "tsyringe";
import { kClient, kCommands, kPrisma, kRaids, kRedis } from "./tokens";

import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_HOST);
container.register(kRedis, { useValue: redis });

const client = new Bot();
container.register(kClient, { useValue: client });

const commands = new Map<string, Command>();

async function init() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  container.register(kPrisma, { useValue: prisma });

  const { Raids } = await import("@struct");
  container.register(kRaids, {
    useValue: new Raids(),
  });

  for await (const entry of readdirp("./commands")) {
    const cmd = container.resolve<Command>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      (await import(entry.fullPath)).default
    );

    logger.info(`Registering command: ${cmd.name}`);

    commands.set(cmd.name, cmd);
  }
  container.register(kCommands, { useValue: commands });

  for await (const entry of readdirp("./events")) {
    const event = container.resolve<Event>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      (await import(entry.fullPath)).default
    );

    logger.info(`Registering event: ${event.name}`);

    client.on(event.name, (...args: unknown[]) => event.execute(...args));
  }

  await client.login(process.env.DISCORD_TOKEN);
}

void init();
