import type { Raid } from './startRaid';
import type { RaidManager } from '#components/RaidManager';

export function abortRaid(this: { raidManager: RaidManager }, raidInfo: Raid<false>) {
	const raidKey = `${raidInfo.guildId}-${raidInfo.memberId}`;
	
	// TODO: this should update the raidInfo message and control panel

	return this.raidManager.raids.delete(raidKey);
}
