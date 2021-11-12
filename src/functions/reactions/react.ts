// Copyright (c) 2020-2021 ewang2002/ZeroRaidBot. All rights reserved. MIT license.
// In particular, FastReactionMenuManager#reactFaster

import type { EmojiResolvable, Message } from "discord.js";

export async function react(
  msg: Message,
  reacts: EmojiResolvable[],
  delay: number = 550
): Promise<any> {
  let i = 0;
  const interval = setInterval(async () => {
    if (i < reacts.length) {
      if (msg.deleted) {
        clearInterval(interval);
        return;
      }

      await msg.react(reacts[i]).catch(() => {});
    } else {
      clearInterval(interval);
    }
    i++;
  }, delay);
}
