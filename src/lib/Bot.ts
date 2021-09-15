import { Command } from "@lib";
import { Client, Collection, Intents } from "discord.js";
import { Db, MongoClient } from "mongodb";
import { Collection as MongoCollection } from "quickmongo";

import { GuildSchema, UserSchema } from "@schemas";
export class Bot extends Client {
  public readonly commands: Collection<string, Command> = new Collection();

  public mongo: MongoClient;
  public db!: Db;

  public users_db!: MongoCollection<typeof UserSchema>;
  public guilds_db!: MongoCollection<typeof GuildSchema>;

  public constructor() {
    super({
      // TODO: intents may not be needed
      intents: [Intents.FLAGS.GUILDS],
    });

    this.mongo = new MongoClient(process.env.mongo_uri!);

    this.init();
  }

  async init(): Promise<void> {
    await this.mongo.connect();

    this.users_db = new MongoCollection(
      this.mongo.db("rotmg-bot").collection("users"),
      UserSchema
    );

    this.guilds_db = new MongoCollection(
      this.mongo.db("rotmg-bot").collection("guilds"),
      GuildSchema
    );
  }
}
