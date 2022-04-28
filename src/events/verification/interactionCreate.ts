import {
	codeBlock,
	hyperlink,
	UnsafeEmbedBuilder,
	UnsafeModalBuilder,
	UnsafeTextInputBuilder,
} from '@discordjs/builders';
import { scrapePlayer } from '@toommyliu/realmeye-scraper';
import { stripIndents } from 'common-tags';
import { ActionRowBuilder, ComponentType, Events, GuildMember, Interaction, TextInputStyle } from 'discord.js';
import { nanoid } from 'nanoid';

import { injectable, inject } from 'tsyringe';
import { kDatabase } from '../../tokens';
import { checkEligibility } from '#functions/verification/checkEligibility';
import { VerificationType, verifyMember } from '#functions/verification/verifyMember';
import { Database } from '#struct/Database';
import type { Event } from '#struct/Event';
import { cancelButton, doneButton } from '#util/constants/buttons';
import { generateActionRows } from '#util/util';
const profileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

@injectable()
export default class implements Event {
	public name = 'Guild interaction verification handling';
	public event = Events.InteractionCreate;

	public constructor(@inject(kDatabase) public readonly db: Database) {}

	public async run(interaction: Interaction) {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isButton()) {
			const mainSettings = await this.db.getSection(interaction.guildId, 'main');
			const veteranSettings = await this.db.getSection(interaction.guildId, 'veteran');

			if (
				interaction.customId === 'main_verification' &&
				interaction.channelId === mainSettings.verificationChannelId
			) {
				if (interaction.member.roles.cache.has(mainSettings.userRoleId)) {
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
							value: stripIndents`
								required completions: ${dungeon.required}
								current completions: ${dungeon.current}
								difference: ${dungeon.required - dungeon.current}`,
						});
					}

					await interaction.editReply({ content: 'you do not meet the requirements', embeds: [embed.toJSON()] });
				} else if (typeof status === 'boolean') {
					if (status) {
						await verifyMember(interaction.member, {
							roleId: veteranSettings.userRoleId,
							type: VerificationType.Veteran,
						});
						await interaction.editReply('you are now veteran verified');
					} else {
						await interaction.editReply('veteran verification failed');
					}
				}
			}
		}

		if (interaction.isModalSubmit()) {
			await interaction.reply({ content: 'Please check your DMs to continue.', ephemeral: true });

			const channel = await interaction.user.createDM().catch(async () => {
				await interaction.editReply('Could not send you a DM, canceling verification.');
				return undefined;
			});

			if (!channel) return;

			const name = interaction.fields.getTextInputValue('name');
			await this.link(interaction.member, name);
		}
	}

	private async link(member: GuildMember, name: string) {
		const { userRoleId } = await this.db.getSection(member.guild.id, 'main');
		const channel = member.user.dmChannel!;

		const code = nanoid(12);

		const embed = new UnsafeEmbedBuilder()
			.setAuthor({
				name: member.guild.name,
				iconURL: member.guild.iconURL() ?? '',
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
			components: generateActionRows(doneButton, cancelButton),
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

			if (!player?.description?.includes(code)) {
				await collectedInteraction.editReply('The code was not found in your profile description.');
				return;
			}

			await verifyMember(member, {
				nickname: name,
				roleId: userRoleId,
				type: VerificationType.Main,
			});

			await collectedInteraction.editReply(
				'You are now verified! If you did not receive the role or a nickname, please contact a staff member.'
			);
		} else if (collectedInteraction?.customId === 'cancel') {
			await collectedInteraction.update({ content: 'You cancelled verification.', embeds: [], components: [] });
		}
	}
}
