import type { PrismaClient } from '@prisma/client';
import { scrapePlayer } from '@toommyliu/realmeye-scraper';
import {
	BaseInteraction,
	Events,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	GuildMember,
	ComponentType,
	codeBlock,
	hyperlink,
} from 'discord.js';
import { nanoid } from 'nanoid';
import { inject, injectable } from 'tsyringe';
import { kPrisma } from '../../tokens';
import { checkVerificationStatus, VerificationStatusCode } from '#functions/verification/checkVerificationStatus';
import { verifyMember, VerificationType } from '#functions/verification/verifyMember';
import type { Event } from '#struct/Event';
import { cancelButton, doneButton, generateActionRows } from '#util/components';

const generateProfileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

@injectable()
export default class implements Event {
	public event = Events.InteractionCreate;
	public name = 'Guild verification interaction handling';

	public constructor(@inject(kPrisma) public readonly prisma: PrismaClient) {}

	public async run(interaction: BaseInteraction) {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isButton()) {
			const guild = await this.prisma.guilds.findFirstOrThrow({ where: { guildId: interaction.guildId } });

			if (
				interaction.customId === 'main_verification' &&
				interaction.channelId === guild.mainRaiding.verificationChannelId
			) {
				if (interaction.member.roles.cache.has(guild.mainRaiding.verificationChannelId)) {
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
				interaction.channelId === guild.veteranRaiding.verificationChannelId
			) {
				if (interaction.member.roles.cache.has(guild.veteranRaiding.userRoleId)) {
					await interaction.reply({ content: 'You are already verified for this section.', ephemeral: true });
					return;
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
						await verifyMember(interaction.member, { roleId: guild.veteranRaiding.userRoleId });
						break;
				}
			}
		}

		if (interaction.isModalSubmit()) {
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
					const guild = await this.prisma.guilds.findFirstOrThrow({ where: { guildId: member.guild.id } });

					await verifyMember(member, { roleId: guild.mainRaiding.userRoleId });
					await collectedInteraction.editReply('You are now verified!');

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
