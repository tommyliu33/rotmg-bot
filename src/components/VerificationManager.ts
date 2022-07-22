// @fs-entity
import { Component, ComponentAPI, Inject, Subscribe } from '@ayanaware/bento';

import { hyperlink, codeBlock } from '@discordjs/builders';
import { scrapePlayer } from '@toommyliu/realmeye-scraper';
import {
	BaseInteraction,
	ModalSubmitInteraction,
	Events,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	InteractionType,
	GuildMember,
	ComponentType,
} from 'discord.js';

import { nanoid } from 'nanoid';

import { Database } from './Database';
import { Discord } from './Discord';

import { checkVerificationStatus, VerificationStatusCode } from '#functions/verification/checkVerificationStatus';
import { verifyMember, VerificationType } from '#functions/verification/verifyMember';

import { cancelButton, doneButton, generateActionRows } from '#util/util';

const generateProfileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

export class VerificationManager implements Component {
	public name = 'Verification manager';
	public api!: ComponentAPI;

	@Inject(Discord) private readonly discord!: Discord;
	@Inject(Database) private readonly database!: Database;

	@Subscribe(Discord, Events.InteractionCreate)
	private async handlebuttonInteraction(interaction: BaseInteraction): Promise<void> {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isButton()) {
			const guild = await this.database.get(interaction.guildId);

			if (
				interaction.customId === 'main_verification' &&
				interaction.channelId === guild['main_raiding']['verification_channel_id']
			) {
				if (interaction.member.roles.cache.has(guild['main_raiding']['user_role_id'])) {
					await interaction.reply({ content: 'You are already verified for this section.', ephemeral: true });
					return;
				}

				const modal = new ModalBuilder()
					.setTitle(`${interaction.guild.name} Verification`)
					.setCustomId('verification_modal')
					.addComponents(
						generateActionRows([
							new TextInputBuilder()
								.setCustomId('name_form')
								.setLabel('Enter your ingame name below')
								.setStyle(TextInputStyle.Short),
						])
					);

				await interaction.showModal(modal);
			} else if (
				interaction.customId === 'veteran_verification' &&
				interaction.channelId === guild['veteran_raiding']['verification_channel_id']
			) {
				if (interaction.member.roles.cache.has(guild['veteran_raiding']['user_role_id'])) {
					await interaction.reply({ content: 'You are already verified for this section.', ephemeral: true });
					return;
				}
			}

			await interaction.deferReply({ ephemeral: true });

			const { status, dungeonCompletions } = await checkVerificationStatus(
				interaction.member,
				VerificationType.Veteran
			);

			switch (status) {
				case VerificationStatusCode.Ignore:
				case VerificationStatusCode.SetName:
					break;
				case VerificationStatusCode.Failed:
					await interaction.editReply('Realmeye profile not found or available.');
					break;
				case VerificationStatusCode.Missing:
					{
						const embed = new EmbedBuilder()
							.setColor('Red')
							.setTitle('Requirements not met')
							.setThumbnail(interaction.member.displayAvatarURL());
						for (const dungeon of Object.values(dungeonCompletions)) {
							if (dungeon.missing < 0) continue;

							embed.addFields({
								name: dungeon.dungeonName,
								value: `${dungeon.current} (${dungeon.missing} more)`,
							});
						}

						await interaction.editReply({ embeds: [embed] });
					}
					break;
				case VerificationStatusCode.AddRole:
					await verifyMember(interaction.member, { roleId: guild['veteran_raiding']['user_role_id'] });
					break;
			}
		}
	}

	@Subscribe(Discord, Events.InteractionCreate)
	private async handleModalInteraction(interaction: ModalSubmitInteraction) {
		if (!interaction.inCachedGuild()) return;

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (interaction.type === InteractionType.ModalSubmit) {
			await interaction.reply({ content: 'Check your messages to continue.', ephemeral: true });

			const channel = await interaction.user.createDM().catch(() => {
				void interaction.editReply('I could not send you a message.');
				return undefined;
			});

			if (channel) {
				const name = interaction.fields.getTextInputValue('name');
				await this.startLinking(interaction.member, name);
			}
		}
	}

	private async startLinking(member: GuildMember, name: string) {
		const channel = member.user.dmChannel!;

		const code = nanoid(15);
		// const code = 'RtuS1E_RaFy97JS'; debug code

		const embed = new EmbedBuilder().setAuthor({
			name: member.guild.name,
			iconURL: member.guild.iconURL()!,
		}).setDescription(`
		Add the following code to any line of your ${hyperlink('Realmeye profile', generateProfileUrl(name))} description
		${codeBlock('fix', code)}
		Click 'Done' to continue or 'Cancel' to cancel.
		`);

		const m = await channel.send({
			embeds: [embed],
			components: generateActionRows([doneButton, cancelButton]),
		});

		const collector = m.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
		collector.on('collect', async (collectedInteraction) => {
			switch (collectedInteraction.customId) {
				case 'done':
					await collectedInteraction.deferReply();

					const realmeyePlayer = await scrapePlayer(name).catch(async (err) => {
						if (err instanceof Error && err.message === 'Player not found') {
							await collectedInteraction.editReply('Realmeye profile not found or available.');
							await m.edit({ components: [] });
						}

						return undefined;
					});

					if (!realmeyePlayer?.description?.includes(code)) {
						await collectedInteraction.editReply('The code was not found.');
						return;
					}
					const guild = await this.database.get(member.guild.id);

					void verifyMember(member, { roleId: guild['main_raiding']['user_role_id'] });
					void collectedInteraction.editReply('You are now verified!');

					try {
						await collectedInteraction.deleteReply();
						await m.delete();
					} catch {}

					break;
				case 'cancel':
					await collectedInteraction.update({ content: 'You cancelled verification.', embeds: [], components: [] });
					break;
			}
		});

		collector.on('end', () => {
			void m.edit({ components: [] }).catch(() => undefined);
		});
	}
}
