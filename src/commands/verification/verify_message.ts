import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, inlineCode } from '@discordjs/builders';
import { toTitleCase } from '@sapphire/utilities';
import { ButtonStyle } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction } from 'discord.js';
import { ComponentType } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kDatabase } from '../../tokens';
import type { Command } from '#struct/Command';
import { Database } from '#struct/Database';

@injectable()
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
				{
					type: 5,
					name: 'button',
					description: 'Whether the user should click the button to start verification for that section',
					required: false,
				},
			],
		},
	];

	public constructor(@inject(kDatabase) public readonly db: Database) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const reply = await interaction.deferReply({ fetchReply: true });

		const section = interaction.options.getString('section', true) as 'main' | 'veteran';
		const button = interaction.options.getBoolean('button', false) ?? false;

		const { verification_requirements, verification_channel_id } = await this.db.getSection(
			interaction.guildId,
			section
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
				await this.db.updateSection(interaction.guildId, section as 'main', 'verification_requirements', content);

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

		const channel = await interaction.guild.channels.fetch(verification_channel_id).catch(async () => {
			await interaction.editReply('The verification channel could not be found.');
			return undefined;
		});

		if (!channel?.isText()) return;
		if (!verification_requirements.verification_message) {
			await interaction.editReply('There is no set verification message to display.');
			return;
		}

		// TODO: refactor

		const verifyKey = section === 'veteran' ? 'veteran_verification' : 'main_verification';
		const verifyButton = new ButtonBuilder().setCustomId(verifyKey).setStyle(ButtonStyle.Primary).setLabel('Verify');

		const opts: { components: any[] } = { components: [] };
		if (button) {
			opts.components = [new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton)];
		}

		const m = await channel.send({
			embeds: [embed.setDescription(verification_requirements.verification_message).toJSON()],
			...opts,
		});

		await interaction.editReply(`Done. See it here:\n${m.url}`);
	}
}
