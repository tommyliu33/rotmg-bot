import { type TextChannel, type ThreadChannel, EmbedBuilder, Client } from 'discord.js';
import { container } from 'tsyringe';
import { Raid, RaidType } from './startRaid';
import { kClient, kRaids } from '../../tokens';
import type { RaidManager } from '#struct/RaidManager';

export function abortRaid(raidInfo: Raid) {
	const client = container.resolve<Client>(kClient);
	const raidManager = container.resolve<RaidManager>(kRaids);

	const raidKey = `${raidInfo.guildId}-${raidInfo.memberId}`;

	// TODO: this should update the raidInfo message and control panel
	if (raidManager.raids.get(raidKey)) {
		const guild = client.guilds.cache.get(raidInfo.guildId)!;
		const statusChannel = guild.channels.cache.get(raidInfo.textChannelId) as TextChannel;
		const controlPanelThread = guild.channels.cache.get(raidInfo.controlPanelThreadId) as ThreadChannel;

		const statusChannelMessage = statusChannel.messages.cache.get(raidInfo.mainMessageId);

		const member = guild.members.cache.get(raidInfo.memberId)!;

		if (statusChannelMessage) {
			const raidType = raidInfo.raidType === RaidType.Afkcheck ? 'Afkcheck' : 'Headcount';
			const firstEmbed = new EmbedBuilder()
				.setColor('DarkRed')
				.setAuthor({
					name: `This ${raidType} was aborted by ${member.displayName}`,
					iconURL: member.displayAvatarURL(),
				})
				.setDescription(`This ${raidType} would have been for ${raidInfo.dungeon.name}`)
				.setTimestamp();

			void statusChannelMessage.edit({ content: ' ', components: [], embeds: [firstEmbed] });
		}

		void controlPanelThread.delete(`Raid aborted by ${member.displayName} (${member.id})`);
		return raidManager.raids.delete(raidKey);
	}
}
