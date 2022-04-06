import { UnsafeModalBuilder, UnsafeTextInputBuilder } from '@discordjs/builders';
import { ActionRowBuilder, Events, Interaction, TextInputStyle } from 'discord.js';

// TODO: refactor settings to use tsconfig paths
import { getGuildSetting } from '../../../functions/settings/getGuildSetting';

import type { Event } from '#struct/Event';

const profileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

export default class implements Event {
	public name = 'Guild interaction verification handling';
	public event = Events.InteractionCreate;

	public async run(interaction: Interaction) {
		if (!interaction.isButton() || !interaction.inCachedGuild()) return;

		if (interaction.inCachedGuild()) {
			const mainSettings = await getGuildSetting(interaction.guildId, 'main');
			const veteranSettings = await getGuildSetting(interaction.guildId, 'veteran');

			if (
				interaction.customId === 'main_verification' &&
				interaction.channelId === mainSettings.verificationChannelId
			) {
				if (interaction.member.roles.cache.has(mainSettings.userRole)) {
					await interaction.reply({ content: 'It seems you are already verified.', ephemeral: true });
					return;
				}

				const modal = new UnsafeModalBuilder()
					.setTitle(`${interaction.guild.name} Verification`)
					.setCustomId('verification_modal');

				const nameForm = new UnsafeTextInputBuilder()
					.setCustomId('name')
					.setLabel('What is your ingame name?')
					.setStyle(TextInputStyle.Short);

				await interaction.showModal(
					modal.addComponents(new ActionRowBuilder<UnsafeTextInputBuilder>().addComponents(nameForm))
				);
			} else if (
				interaction.customId === 'veteran_verification' &&
				interaction.channelId === veteranSettings.verificationChannelId
			) {
				await interaction.deferReply();
				// await handleVerification(interaction, VerificationType.Veteran);
			}
		}
	}
}
