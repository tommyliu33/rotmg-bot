import { CaseAction, CaseInfo, getGuildSetting, SettingsKey } from "@functions";
import { oneLine } from "common-tags";
import { Formatters, Snowflake, TextChannel } from "discord.js";
import logger from "../../logger";

function generateCaseEmoji(action: CaseAction) {
  let emoji: string;
  switch (action) {
    case CaseAction.BAN:
      emoji = "🔨";
    default:
      emoji = "";
      break;
  }
  return emoji;
}

export async function sendModLog(
  modLogChannel: TextChannel,
  caseInfo: CaseInfo
): Promise<Snowflake> {
  const caseNum = await getGuildSetting(
    modLogChannel.guildId,
    SettingsKey.Cases
  );

  const { action, target_id, moderator_id } = caseInfo;
  const emoji = generateCaseEmoji(action);

  const target = await modLogChannel.client.users.fetch(target_id);
  const moderator = await modLogChannel.client.users.fetch(moderator_id);

  const timeString = [
    new Date().getHours(),
    new Date().getMinutes(),
    new Date().getSeconds(),
  ].join(":");

  const inline = Formatters.inlineCode;
  const message = oneLine`[${inline(timeString)}] ${emoji} ${
    target.tag
  } (${inline(target.id)}) was banned by ${moderator.tag} (${inline(
    moderator.id
  )}) for ${inline(caseInfo.reason ?? "No reason provided.")} (${inline(
    `#${caseNum.length + 1}`
  )})`;

  try {
    const msg = await modLogChannel.send({ content: message });
    return msg.id;
  } catch (e) {
    const err = e as Error;
    logger.info(err.message, err);

    return "";
  }
}
