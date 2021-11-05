import type { Snowflake } from "discord-api-types";
import { Db, MongoClient } from "mongodb";
import { singleton } from "tsyringe";
import { set } from "dot-prop";

interface Guild {
  id: Snowflake;
  channels: {
    afk_check: Snowflake;
    vet_afk_check: Snowflake;
  };
  categories: {
    main: Snowflake;
    veteran: Snowflake;
  };
  user_roles: {
    // TODO: key roles
    main: Snowflake;
    veteran: Snowflake;
  };
  // TODO: leader roles
  leader_roles: {};
}

type GUILD_KEY =
  | "channels.afk_check"
  | "channels.vet_afk_check"
  | "categories.main"
  | "categories.veteran"
  | "user_roles.main"
  | "user_roles.veteran";

@singleton()
export class Database {
  private CONNECTION_URI!: string;
  private mongoClient: MongoClient;
  private db!: Db;
  public constructor() {
    Object.defineProperty(this, "CONNECTION_URI", {
      value: process.env["mongo_uri"],
    });

    this.mongoClient = new MongoClient(this.CONNECTION_URI);
  }

  public get guilds() {
    return this.db.collection("guilds");
  }

  public get users() {
    return this.db.collection("users");
  }

  public async init() {
    await this.mongoClient.connect();
    this.db = this.mongoClient.db("rotmg-bot");
    console.log("[database] :: connected");
  }

  public async getGuild(id: Snowflake): Promise<Guild> {
    const entry = (await this.guilds.findOne({ id })) as Guild;
    if (!entry) {
      // TODO: method to build default cfg
      const base = {
        id,
        channels: {
          afk_check: "",
          vet_afk_check: "",
        },
        categories: {
          main: "",
          veteran: "",
        },
        user_roles: {
          main: "",
          veteran: "",
        },
        leader_roles: {},
      };

      this.guilds.insertOne(base);
      return base;
    }

    return entry;
  }

  public async setGuildKey(
    id: Snowflake,
    key: GUILD_KEY,
    value: any
  ): Promise<any> {
    const entry = await this.getGuild(id);
    set(entry, key, value);

    await this.guilds.updateOne(
      {
        id,
      },
      {
        $set: entry,
      },
      {
        upsert: true,
      }
    );

    return;
  }
}
