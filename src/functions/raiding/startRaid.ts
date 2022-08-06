import type { Collection, Client } from 'discord.js';
import { container } from 'tsyringe';
import { announceRaid } from './announceRaid';
import { setupControlPanel, setupControlPanelEmbed } from './controlPanel';
import { kClient, kRaids } from '../../tokens';
import type { RaidManager, Dungeon } from '#struct/RaidManager';

export const enum RaidType {
	Headcount,
	Afkcheck,
}

export async function startRaid(raidInfo: PartialRaid) {
	const client = container.resolve<Client>(kClient);
	const raidManager = container.resolve<RaidManager>(kRaids);

	const guild = client.guilds.cache.get(raidInfo.guildId)!;
	const member = guild.members.cache.get(raidInfo.memberId)!;

	const raidType = raidInfo.raidType === RaidType.Headcount ? 'Headcount' : 'Afkcheck';
	const controlPanel = await setupControlPanel(raidInfo, {
		name: `${member.displayName}'s ${raidInfo.dungeon.name} ${raidType}`,
	});
	const controlPanelMessage = await setupControlPanelEmbed(controlPanel!, raidInfo);

	const { id } = await announceRaid(raidInfo);
	raidManager.raids.set(`${raidInfo.guildId}-${raidInfo.memberId}`, {
		...raidInfo,
		mainMessageId: id,
		controlPanelThreadId: controlPanel!.id,
		controlPanelThreadMessageId: controlPanelMessage.id,
		users: new Set(),
	});
}

// what we start with
export interface PartialRaid {
	dungeon: Dungeon;
	guildId: string;
	memberId: string;

	textChannelId: string;
	voiceChannelId: string;
	controlPanelId: string;

	isVet: boolean;
	raidType: RaidType;
}

export type Raid<T extends boolean = false> = PartialRaid & {
	controlPanelThreadId: string;
	controlPanelThreadMessageId: string;
	users: Set<string>;
} & T extends true
	? PartialRaid &
			Raid & {
				reactions: Collection<string, RaidReactions>;
				location: string;
				locationRevealed: boolean;
			}
	: PartialRaid & {
			mainMessageId: string;
			controlPanelThreadId: string;
			controlPanelThreadMessageId: string;
			users: Set<string>;
	  };

interface RaidReactions {
	confirmed: Set<string>;
	pending: Set<string>;
}
