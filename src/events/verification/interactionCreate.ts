import { codeBlock, hyperlink, EmbedBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { scrapePlayer } from '@toommyliu/realmeye-scraper';
import { stripIndents } from 'common-tags';
import { InteractionType } from 'discord-api-types/v10';
import { ComponentType, Events, GuildMember, Interaction, TextInputStyle, Colors } from 'discord.js';
import { nanoid } from 'nanoid';
import { config } from '../../util/config';
import { checkVerificationStatus, VerificationStatusCode } from '#functions/verification/checkVerificationStatus';
import { VerificationType, verifyMember } from '#functions/verification/verifyMember';
import type { Event } from '#struct/Event';
import { cancelButton, CANCEL_ID, doneButton, DONE_ID, generateActionRows } from '#util/util';

const generateProfileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

export default class implements Event {
	public name = 'Guild interaction verification handling';
	public event = Events.InteractionCreate;

	public async run(interaction: Interaction) {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isButton()) {
			if (
				interaction.customId === 'main_verification' &&
				interaction.channelId === config['main_raiding']['verification_channel_id']
			) {
				if (interaction.member.roles.cache.has(config['main_raiding']['user_role_id'])) {
					await interaction.reply({ content: 'You are already verified.', ephemeral: true });
					return;
				}

				const modal = new ModalBuilder()
					.setTitle(`${interaction.guild.name} Verification`)
					.setCustomId('verification_modal');

				const nameForm = new TextInputBuilder()
					.setCustomId('name')
					.setLabel('Enter your ingame name below')
					.setStyle(TextInputStyle.Short);

				await interaction.showModal(modal.addComponents(generateActionRows([nameForm])));
			} else if (
				interaction.customId === 'veteran_verification' &&
				interaction.channelId === config['veteran_raiding']['verification_channel_id']
			) {
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
								.setColor(Colors.Red)
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
						await verifyMember(interaction.member, { roleId: config['veteran_raiding']['user_role_id'] });
						break;
				}
			}
		}

		if (
			interaction.type === InteractionType.ModalSubmit &&
			interaction.customId === 'main_verification' &&
			interaction.isRepliable()
		) {
			await interaction.reply({ content: 'Check your messages to continue.', ephemeral: true });

			const channel = await interaction.user.createDM().catch(async () => {
				await interaction.editReply('Could not send you a DM, canceling verification.');
				return undefined;
			});

			if (channel) {
				const name = interaction.fields.getTextInputValue('name');
				await this.startLink(interaction.member, name);
			}
		}
	}

	private async startLink(member: GuildMember, name: string) {
		const channel = member.user.dmChannel!;

		const code = nanoid(15);
		// const code = 'RtuS1E_RaFy97JS';

		const embed = new EmbedBuilder()
			.setAuthor({
				name: member.guild.name,
				iconURL: member.guild.iconURL()!,
			})
			.setDescription(
				stripIndents`
			Add the following code to any line of your ${hyperlink('Realmeye profile', generateProfileUrl(name))} description

			${codeBlock('fix', code)}
			Click 'Done' to continue or 'Cancel' to cancel.
			`
			);

		const m = await channel.send({
			embeds: [embed],
			components: generateActionRows([doneButton, cancelButton]),
		});

		const collector = m.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
		collector.on('collect', async (collectedInteraction) => {
			switch (collectedInteraction.customId) {
				case DONE_ID:
					await collectedInteraction.deferReply();

					const player = await scrapePlayer(name).catch(async (err) => {
						if (err instanceof Error && err.message === 'Player not found') {
							await collectedInteraction.message.edit({ content: 'Realmeye profile not found or available.' });
							await m.edit({ components: [] });
						}

						return undefined;
					});

					if (!player?.description?.includes(code)) {
						await collectedInteraction.editReply('The code could not be found in your description.');
						return;
					}

					await verifyMember(member, {
						nickname: name,
						roleId: config['main_raiding']['user_role_id'],
					});
					await m.channel.send(
						'You are now verified! If you did not receive the role or a nickname, please contact a staff member.'
					);

					try {
						await collectedInteraction.deleteReply();
						await m.delete();
					} catch {}

					break;
				case CANCEL_ID:
					await collectedInteraction.update({ content: 'You cancelled verification.', embeds: [], components: [] });
					break;
			}
		});

		collector.on('end', () => {
			m.edit({ components: [] }).catch(() => undefined);
		});
	}
}
