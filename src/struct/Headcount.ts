import type { Dungeon } from './RaidManager';

import { injectable, inject } from 'tsyringe';
import { kClient } from '../tokens';

import { type Client, type Guild, type GuildMember, Embed, ActionRow, ButtonComponent, ButtonStyle } from 'discord.js';

const endButton = new ButtonComponent()
	.setStyle(ButtonStyle.Primary)
	.setCustomId('headcount_end')
	.setLabel('End headcount');
const abortButton = new ButtonComponent()
	.setStyle(ButtonStyle.Secondary)
	.setCustomId('headcount_abort')
	.setLabel('Abort headcount');

const controlPanelButtons = new ActionRow().addComponents(endButton, abortButton);

export interface IHeadcount {
	guildId: string;

	memberId: string;
	messageId: string;

	textChannelId: string;
	voiceChannelId: string;

	dungeon: Dungeon;
}

@injectable()
export class Headcount implements IHeadcount {
	guildId!: string;
	guild!: Guild;
	memberId!: string;
	messageId!: string;
	textChannelId!: string;
	voiceChannelId!: string;
	dungeon!: Dungeon;

	public constructor(@inject(kClient) public readonly client: Client<true>) {}
}
