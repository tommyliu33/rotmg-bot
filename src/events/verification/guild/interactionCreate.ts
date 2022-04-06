import { UnsafeModalBuilder, UnsafeTextInputBuilder, UnsafeEmbedBuilder } from '@discordjs/builders';
import { ActionRowBuilder, Events, Interaction, TextInputStyle } from 'discord.js';

// TODO: refactor settings to use tsconfig paths
import { getGuildSetting } from '../../../functions/settings/getGuildSetting';

import type { Event } from '#struct/Event';
import { checkEligibility } from '../../../functions/verification/checkEligibility';
import { VerificationType, verifyMember } from '../../../functions/verification/verifyMember';
import { stripIndent } from 'common-tags';

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
				await interaction.deferReply({ ephemeral: true });
				const status = await checkEligibility(interaction.member, VerificationType.Veteran);

				if (typeof status === 'object') {
					const embed = new UnsafeEmbedBuilder();

					for (const dungeon of status) {
						embed.addFields({
							name: dungeon.dungeon,
							value: stripIndent`
							required completions: ${dungeon.required}
							current completions: ${dungeon.current}
							difference: ${dungeon.required - dungeon.current}`,
						});
					}

					await interaction.editReply({ content: 'you do not meet the requirements', embeds: [embed.toJSON()] });
				} else if (typeof status === 'boolean') {
					if (status) {
						await verifyMember(interaction.member, {
							roleId: veteranSettings.userRole,
							type: VerificationType.Veteran,
						});
						await interaction.editReply('you are now veteran verified');
					} else {
						await interaction.editReply('veteran verification failed');
					}
				}
			}
		}
	}
}
