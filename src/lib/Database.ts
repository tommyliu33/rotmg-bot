import { Db, MongoClient } from "mongodb";
import { singleton } from "tsyringe";

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
}
