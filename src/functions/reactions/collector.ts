import ms from "@naval-base/ms";
import type { Message, MessageReaction, User } from "discord.js";

// TODO: finish
export async function collector(
  msg: Message,
  timeString: string
): Promise<any> {
  const filter = (_: MessageReaction, u: User) => {
    return !u.bot;
  };

  const collector = await msg
    .awaitReactions({
      filter,
      time: ms(timeString),
    })
    .catch(() => {
      return undefined;
    });

  if (!collector) return;

  console.log(collector);
}
