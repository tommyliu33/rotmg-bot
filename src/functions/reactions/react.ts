// Copyright (c) 2020-2021 ewang2002/ZeroRaidBot. All rights reserved. MIT license.
// In particular, FastReactionMenuManager#reactFaster

import type { EmojiResolvable, Message } from "discord.js";

export function react(
  msg: Message,
  reacts: EmojiResolvable[],
  delay = 550
): void {
  let i = 0;
  const interval = setInterval(() => {
    // if the leader reacts to ❌ before
    if (msg.reactions.cache.has("❌")) {
      clearInterval(interval);
      return;
    }

    if (i < reacts.length) {
      if (msg.deleted) {
        clearInterval(interval);
        return;
      }

      msg.react(reacts[i]).catch(() => {
        return undefined;
      });
    } else {
      clearInterval(interval);
    }
    i++;
  }, delay);
}
