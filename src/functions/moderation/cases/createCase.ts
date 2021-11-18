import { getModLogChannel, Guild, sendModLog } from "@functions";
import { Bot, Database } from "@lib";
import type { Snowflake } from "discord.js";
import { container } from "tsyringe";
import { kClient, kDatabase } from "../../../tokens";

export interface CaseInfo {
  id: string;
  action: CaseAction;

  message_id: Snowflake;

  moderator_id: Snowflake;
  moderator_tag: string;

  target_id: Snowflake;
  target_tag: string;

  reason?: string;

  delete_message_days?: number;
}

export enum CaseAction {
  BAN = "Ban",
  UNBAN = "Unban",
  SOFTBAN = "Softban",
  KICK = "Kick",
  WARN = "Warning",
  MUTE = "Mute",
  UNMUTE = "Unmute",
}

export async function createCase(
  guildId: Snowflake,
  caseInfo: CaseInfo
): Promise<boolean> {
  try {
    const client = container.resolve<Bot>(kClient);
    const db = container.resolve<Database>(kDatabase);
    const data: Guild = (await db.guilds.findOne({
      id: guildId,
    })) as unknown as Guild;

    const guild = await client.guilds.fetch(guildId);
    const logChannel = await getModLogChannel(
      guild,
      data.moderation.mod_log_channel_id
    );

    if (logChannel) {
      const msgId = await sendModLog(logChannel!, caseInfo);
      caseInfo = { ...caseInfo, message_id: msgId };
    }

    data.moderation.cases.push({
      ...caseInfo,
      reason: `Moderator ${caseInfo.moderator_tag} | ${caseInfo.reason}`,
    });

    await db.guilds.updateOne(
      {
        id: guildId,
      },
      {
        $set: data,
      },
      {
        upsert: true,
      }
    );
    return true;
  } catch {
    return false;
  }
}
