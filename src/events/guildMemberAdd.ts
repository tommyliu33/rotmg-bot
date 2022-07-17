import { Events, type GuildMember } from 'discord.js';
import type { Event } from '#struct/Event';

import { createUser } from '#util/mongo';

export default class implements Event {
	public name = 'Guild member add';
	public event = Events.GuildMemberAdd;

	public async run(member: GuildMember) {
		await createUser(member.guild.id);
	}
}
