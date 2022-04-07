import { codeBlock, hyperlink, UnsafeEmbedBuilder } from '@discordjs/builders';
import { scrapePlayer } from '@toommyliu/realmeye-scraper';
import { stripIndents } from 'common-tags';
import { ActionRowBuilder, ComponentType, Events, Interaction } from 'discord.js';
import { nanoid } from 'nanoid';
import { getGuildSetting } from '../../../functions/settings/getGuildSetting';
import { VerificationType, verifyMember } from '../../../functions/verification/verifyMember';
import { cancelButton, doneButton } from '#constants/buttons';

import type { Event } from '#struct/Event';

const profileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

export default class implements Event {
	public name = 'Direct messages interaction verification handling';
	public event = Events.InteractionCreate;

	public async run(interaction: Interaction<'cached'>) {
		if (!interaction.isModalSubmit()) return;
		const mainSettings = await getGuildSetting(interaction.guildId, 'main');

		if (interaction.channelId === mainSettings.verificationChannelId) {
			await interaction.reply({ content: 'Please check your DMs to continue.', ephemeral: true });

			const channel = await interaction.user.createDM().catch(async () => {
				await interaction.editReply('Could not send you a DM, cancelling verification.');
				return undefined;
			});

			if (!channel) return;

			const name = interaction.fields.getTextInputValue('name');

			const code = nanoid(12);
			// const code = 'xXwZCabm3M8eeIs';

			const embed = new UnsafeEmbedBuilder()
				.setAuthor({
					name: interaction.guild.name,
					iconURL: interaction.guild.iconURL() ?? '',
				})
				.setDescription(
					stripIndents`
					Add the following code to any line of your ${hyperlink('Realmeye profile', profileUrl(name))} description

					${codeBlock('fix', code)}
					Click 'Done' to continue or 'Cancel' to cancel.
					`
				);

			const m = await channel.send({
				embeds: [embed],
				components: [new ActionRowBuilder<typeof doneButton>().addComponents(doneButton, cancelButton)],
			});

			const collectedInteraction = await m
				.awaitMessageComponent({
					componentType: ComponentType.Button,
					time: 60_000,
				})
				.catch(async () => {
					await m.edit({ components: [] });
					return undefined;
				});

			if (collectedInteraction?.customId === 'done') {
				await collectedInteraction.deferReply();

				const player = await scrapePlayer(name).catch(async (err) => {
					if (err instanceof Error && err.message === 'Player not found') {
						await collectedInteraction.editReply({ content: 'Your profile was private or does not exist.' });
						await m.edit({ components: [] });
					}

					return undefined;
				});

				if (!player) return;
				if (!player.description!.includes(code)) {
					await collectedInteraction.editReply('The code was not found in your profile description.');
					return;
				}

				await verifyMember(interaction.member, {
					roleId: mainSettings.userRole,
					type: VerificationType.Main,
					nickname: name,
				});

				await collectedInteraction.editReply(
					'You are now verified! If you did not receive the role or a nickname, please contact a staff member.'
				);
			} else if (collectedInteraction?.customId === 'cancel') {
				await collectedInteraction.update({ content: 'You cancelled verification.', embeds: [], components: [] });
			}
		}
	}
}
