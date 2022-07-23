import { type TextChannel, type ThreadChannel, EmbedBuilder } from 'discord.js';
import type { Raid } from './startRaid';
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
			const firstEmbed = new EmbedBuilder()
				.setColor('DarkRed')
				.setAuthor({
					name: `Aborted by ${member.displayName}`,
					iconURL: member.displayAvatarURL(),
				})
				.setTimestamp();

			void statusChannelMessage.edit({ content: ' ', components: [], embeds: [firstEmbed] });
		}

		void controlPanelThread.delete(`Raid aborted by ${member.displayName} (${member.id})`);
		return this.raidManager.raids.delete(raidKey);
	}
}
