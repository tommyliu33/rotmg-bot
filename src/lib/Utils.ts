import { REST } from "@discordjs/rest";
import type { Bot, Command } from "@lib";
import { Routes } from "discord-api-types/v9";
import { lstatSync, readdirSync } from "fs";
import { join, resolve } from "path";

const user_id = process.env.application_id;
const guild_id = process.env.guild_id;

export abstract class Utils {
  static walk(directory: string): string[] {
    function read(dir: string, files: string[] = []) {
      for (const item of readdirSync(dir)) {
        const path = resolve(join(dir, item)),
          stat = lstatSync(path);
        if (stat.isDirectory()) {
          files.concat(read(path, files));
        } else if (stat.isFile()) {
          files.push(path);
        }
      }

      return files;
    }

    return read(directory);
  }

  static async syncCommands(bot: Bot): Promise<void> {
    const rest = new REST({ version: "9" }).setToken(process.env.bot_token!);
    const commands: { name: string; description: string; options: any[] }[] =
      [];
    for (const path of Utils.walk("./commands")) {
      const command: Command = new (await import(path)).default();

      const { name, description, options } = command;

      commands.push({ name, description, options });
      bot.commands.set(name, command);
    }

    await rest.put(Routes.applicationGuildCommands(user_id!, guild_id!), {
      body: commands,
    });
    console.log("[slash commands] done.");
  }
}
