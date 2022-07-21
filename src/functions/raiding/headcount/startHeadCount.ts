import type { Database } from '../../../components/Database';
import type { Discord } from '../../../components/Discord';
import type { RaidManager } from '../../../components/RaidManager';

import { announceRaid } from '../announceRaid';
import { createControlPanelChannel } from '../createControlPanelChannel';

import { Raid, RaidType } from '../startRaid';

export async function startHeadCount(
	this: { discord: Discord; database: Database; raidManager: RaidManager },
	raidInfo: Omit<Raid, 'mainMessageId'>
) {
	const doc = await this.database.get(raidInfo.guildId);
	const guild = this.discord.client.guilds.cache.get(raidInfo.guildId)!;
	const member = guild.members.cache.get(raidInfo.memberId)!;

	const controlPanel = await createControlPanelChannel(
		raidInfo.guildId,
		raidInfo.isVet ? doc.veteran_raiding.control_panel_channel_id : doc.main_raiding.control_panel_channel_id,
		{
			name: `${member.displayName}'s ${raidInfo.dungeon.name} Headcount`,
		}
	);
	const message = await announceRaid({ ...raidInfo, raidType: RaidType.Headcount });
}
