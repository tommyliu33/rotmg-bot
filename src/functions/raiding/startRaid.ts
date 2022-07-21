import { getBento } from '@ayanaware/bento';
import { startAfkCheck } from './afkcheck/startAfkCheck';
import { announceRaid } from './announceRaid';
import { startHeadCount } from './headcount/startHeadCount';
import { Database } from '../../components/Database';
import { Discord } from '../../components/Discord';
import { RaidManager, type Dungeon } from '../../components/RaidManager';

export const enum RaidType {
	Headcount,
	Afkcheck,
}

export async function startRaid(raidInfo: Omit<Raid, 'mainMessageId'>) {
	const bento = getBento();
	const discord = bento.getComponent(Discord);
	const raidManager = bento.getComponent(RaidManager);
	const database = bento.getComponent(Database);

	const thisArg = { discord, raidManager, database };

	switch (raidInfo.raidType) {
		case RaidType.Headcount:
			await startHeadCount.call(thisArg, raidInfo);
			break;
		case RaidType.Afkcheck:
			await startAfkCheck.call(thisArg, raidInfo);
			break;
	}

	const { id } = await announceRaid.call(thisArg.raidManager, raidInfo);
	raidManager.raids.set(`${raidInfo.guildId}-${raidInfo.memberId}`, { ...raidInfo, mainMessageId: id });
}

export interface RaidInfo {
	dungeon: Dungeon;
	guildId: string;
	memberId: string;
	mainMessageId: string | undefined;
	textChannelId: string;
	voiceChannelId: string;

	isVet: boolean;
}

export type Raid = RaidInfo & { raidType: RaidType };
