import type { Command } from '#struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { getGuildSetting } from '../../functions/settings/getGuildSetting';
import { setGuildSetting } from '../../functions/settings/setGuildSetting';
import { toTitleCase } from '@sapphire/utilities';
import { ComponentType } from 'discord.js';
import { EmbedBuilder, inlineCode, ButtonBuilder, ActionRowBuilder } from '@discordjs/builders';
import { ButtonStyle } from 'discord-api-types/v10';

export default class implements Command {
	public name = 'verify_message';
	public description = "Sends the section's verification requirements";
	public options = [
		{
			type: 1,
			name: 'edit',
			description: 'Update the verification message',
			options: [
				{
					type: 3,
					name: 'section',
					description: 'The section requirements to edit',
					choices: [
						{
							name: 'Main',
							value: 'main',
						},
						{
							name: 'Veteran',
							value: 'veteran',
						},
					],
					required: true,
				},
			],
		},
		{
			type: 1,
			name: 'send',
			description: 'Send the verification message',
			options: [
				{
					type: 3,
					name: 'section',
					description: 'The section to send the message in',
					choices: [
						{
							name: 'Main',
							value: 'main',
						},
						{
							name: 'Veteran',
							value: 'veteran',
						},
					],
					required: true,
				},
			],
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const reply = await interaction.deferReply({ fetchReply: true });

		const section = interaction.options.getString('section', true);
		const { verificationRequirements, verificationChannelId } = await getGuildSetting(
			interaction.guildId,
			section as 'main' | 'veteran'
		);

		const embed = new EmbedBuilder().setTitle(
			`${inlineCode(interaction.guild.name)} ${toTitleCase(section)} Section Verification`
		);

		if (interaction.options.getSubcommand(true) === 'edit') {
			await interaction.editReply(
				'Enter the message you want to display. It will be displayed in an embed.\nYou have 1 minute to respond.'
			);
			const messages = await reply.channel
				.awaitMessages({
					filter: (m) => m.author.id === interaction.user.id,
					time: 60_000,
					max: 1,
				})
				.catch(async () => {
					await interaction.editReply('Collector timed out, run the command to start again.');
					return undefined;
				});

			if (!messages?.first()) return;

			const msg = messages.first()!;
			const { content } = msg;

			try {
				await msg.delete();
			} catch {}

			const yesKey = 'yes';
			const noKey = 'no';

			const yesButton = new ButtonBuilder()
				.setCustomId(yesKey)
				.setLabel(toTitleCase(yesKey))
				.setStyle(ButtonStyle.Primary);

			const noButton = new ButtonBuilder()
				.setCustomId(noKey)
				.setLabel(toTitleCase(noKey))
				.setStyle(ButtonStyle.Secondary);

			await interaction.editReply({
				content: 'This is what users will see, click yes/no to continue.',
				embeds: [embed.setDescription(content).toJSON()],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(yesButton, noButton)],
			});

			const collectedInteraction = await reply
				.awaitMessageComponent({
					componentType: ComponentType.Button,
					filter: async (i) => {
						await i.deferUpdate();
						return i.user.id === interaction.user.id;
					},
					time: 60_000,
				})
				.catch(async () => {
					await interaction.editReply({ components: [] });
					return undefined;
				});

			if (collectedInteraction?.customId === yesKey) {
				await setGuildSetting(interaction.guildId, section as 'main', 'verification_requirements', {
					...verificationRequirements,
					verification_message: content,
				});

				await collectedInteraction.editReply({
					content: `Updated the ${inlineCode(toTitleCase(section))} verification message.`,
					components: [],
				});
			} else if (collectedInteraction?.customId === noKey) {
				await collectedInteraction.editReply({
					content: 'Cancelled.',
					embeds: [],
					components: [],
				});
			}
			return;
		}

		const channel = await interaction.guild.channels.fetch(verificationChannelId).catch(async () => {
			await interaction.editReply('The verification channel could not be found.');
			return undefined;
		});

		if (!channel?.isText()) return;
		if (!verificationRequirements?.verification_message) {
			await interaction.editReply('There is no set verification message to display.');
			return;
		}

		const verifyKey = 'main_verification';
		const verifyButton = new ButtonBuilder().setCustomId(verifyKey).setStyle(ButtonStyle.Primary).setLabel('Verify');

		const m = await channel.send({
			embeds: [embed.setDescription(verificationRequirements.verification_message).toJSON()],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton)],
		});

		await setGuildSetting(interaction.guildId, section as 'main', 'verification_requirements', {
			...verificationRequirements,
			verification_message_id: m.id,
			verification_button_id: verifyKey,
		});

		await interaction.editReply(`Done. See it here:\n${m.url}`);
	}
}
