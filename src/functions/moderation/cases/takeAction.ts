import { CaseAction, CaseInfo } from "@functions";
import type { Guild } from "discord.js";
import logger from "../../../logger";

export async function takeAction(guild: Guild, caseInfo: CaseInfo) {
  const userId = caseInfo.target_id;
  const { reason } = caseInfo;

  try {
    switch (caseInfo.action) {
      case CaseAction.BAN:
        await guild.bans.create(userId, {
          days: caseInfo.delete_message_days ?? 0,
          reason: reason,
        });
        break;
      case CaseAction.UNBAN:
        await guild.members.unban(userId, reason);
        break;
      case CaseAction.SOFTBAN:
        await guild.bans.create(userId, {
          days: caseInfo.delete_message_days ?? 0,
          reason: userId,
        });
        await guild.members.unban(userId, reason);
        break;
      case CaseAction.KICK:
        await guild.members.kick(userId, reason);
        break;
    }
  } catch (e) {
    const err = e as Error;
    logger.error(err.message, err);
  }
}
