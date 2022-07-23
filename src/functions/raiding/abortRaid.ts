import { type TextChannel, type ThreadChannel, EmbedBuilder } from 'discord.js';
import { Raid, RaidType } from './startRaid';
import type { Discord } from '#components/Discord';
import type { RaidManager } from '#components/RaidManager';

export function abortRaid(this: { discord: Discord; raidManager: RaidManager }, raidInfo: Raid) {
	const raidKey = `${raidInfo.guildId}-${raidInfo.memberId}`;

	// TODO: this should update the raidInfo message and control panel
	if (this.raidManager.raids.get(raidKey)) {
		const guild = this.discord.client.guilds.cache.get(raidInfo.guildId)!;
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
		return this.raidManager.raids.delete(raidKey);
	}
}
