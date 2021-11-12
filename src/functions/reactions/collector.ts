// Copyright (c) 2020-2021 ewang2002/ZeroRaidBot. All rights reserved. MIT license.
// In particular, FastReactionMenuManager#reactFaster
// Refactored for personal use

import ms from "@naval-base/ms";
import type {
  EmojiResolvable,
  Message,
  MessageReaction,
  User,
} from "discord.js";

export async function collector(
  msg: Message,
  reacts: EmojiResolvable[],
  timeString: string
): Promise<any> {
  const filter = (m: MessageReaction, u: User) => {
    return !u.bot;
  };

  const collector = await msg
    .awaitReactions({
      // filter,
      time: ms(timeString),
    })
    .catch(() => {});

  if (!collector) return console.log("here");

  console.log(collector);
}
