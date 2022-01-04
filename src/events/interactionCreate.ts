import type { Interaction, TextChannel } from 'discord.js';
import type { Command, Event, RaidManager } from '../struct';

import { Collection, Message, MessageActionRow, MessageButton } from 'discord.js'; // eslint-disable-line no-duplicate-imports

import { inject, injectable } from 'tsyringe';
import { logger } from '../logger';
import { kCommands, kRaids, kRedis } from '../tokens';
import type { Redis } from 'ioredis';

import { getGuildSetting, lookup, getUserSettings } from '../functions';
import { MessagePrompter, isDMChannel } from '@sapphire/discord.js-utilities';

import { stripIndents } from 'common-tags';
import { Embed, inlineCode, hyperlink, codeBlock } from '@discordjs/builders';
import { profileUrl } from '../util';
import { nanoid } from 'nanoid';

interface VerificationSession {
	userId: string;
	guildId: string;

	code: string;

	name: string;
	profileUrl: string;

	yesKey: string;
	noKey: string;

	veteran: boolean;
}

// TODO: refactor

@injectable()
export default class implements Event {
	public name = 'interactionCreate';
	public sessions: Collection<string, VerificationSession>;

	public constructor(
		@inject(kCommands) public readonly commands: Map<string, Command>,
		@inject(kRedis) public readonly redis: Redis,
		@inject(kRaids) public readonly manager: RaidManager
	) {
		this.sessions = new Collection();
	}

	public async execute(interaction: Interaction) {
		// #region / commands
		if (interaction.isCommand()) {
			const { commandName } = interaction;
			const command = this.commands.get(commandName);

			if (command) {
				try {
					await command.execute(interaction);

					logger.info(`${interaction.user.tag} (${interaction.user.id}) ran an command: ${commandName}`);
				} catch (e) {
					const err = e as Error;
					logger.error(err.stack ?? err.message);
				}
			}
		}
		// #endregion

		// #region buttons
		if (interaction.isButton()) {
			if (interaction.inCachedGuild()) {
				// #region verification
				await interaction.deferReply({ ephemeral: true }).catch(() => undefined);

				let mainButtonId = await this.redis.get(`${interaction.guildId}:main_button_id`);
				let vetButtonId = await this.redis.get(`${interaction.guildId}:vet_button_id`);

				if (!mainButtonId) {
					mainButtonId = await getGuildSetting(interaction.guildId, 'MainVerificationButton');
					await this.redis.setex(`${interaction.guildId}:main_button_id`, 3.6e6, mainButtonId);
				}

				if (!vetButtonId) {
					vetButtonId = await getGuildSetting(interaction.guildId, 'VeteranVerificationButton');
					await this.redis.setex(`${interaction.guildId}:vet_button_id`, 3.6e6, vetButtonId);
				}

				if (interaction.customId === mainButtonId) {
					await interaction.editReply({ content: 'You have started verification. Check your DMs to continue.' });

					const channel = await interaction.user.createDM().catch(() => undefined);
					if (!channel) return;

					const prompter = new MessagePrompter(
						{
							content: stripIndents`
						Enter your ingame name. 
						You have 15 seconds to respond. Type ${inlineCode('cancel')} to exit verification. 
					`,
						},
						'message',
						{
							timeout: 15000,
						}
					);

					const res = await prompter.run(channel, interaction.user).catch(async () => {
						await interaction.editReply({
							content: "You didn't enter a response in time, click the button to restart.",
						});
						await prompter.strategy.appliedMessage?.delete();
						return undefined;
					});

					if (!(res instanceof Message)) return;

					if (res.content.toLowerCase() === 'cancel') {
						await prompter.strategy.appliedMessage?.delete();
						await interaction.editReply({
							content: 'You have exited verification, click the button to restart.',
						});

						return;
					}

					const name = res.content;
					// const code = nanoid(15);

					const code = 'olZMjp8p5yhmq';

					const yesKey = nanoid();
					const noKey = nanoid();

					const yesButton = new MessageButton().setCustomId(yesKey).setLabel('Done').setStyle('PRIMARY');
					const noButton = new MessageButton().setCustomId(noKey).setLabel('Cancel').setStyle('DANGER');

					const embed = new Embed()
						.setDescription(
							stripIndents`
    Add the code to any line of your ${hyperlink('Realmeye description', profileUrl(name))}: ${codeBlock('fix', code)}`
						)
						.setFooter({
							text: 'You may need to wait for your profile to properly sync. (1-2minutes)',
						});

					await channel.send({
						embeds: [embed],
						components: [new MessageActionRow().addComponents(yesButton, noButton)],
					});

					await this.sessions.set(`${interaction.guildId}:${interaction.user.id}`, {
						userId: interaction.user.id,
						guildId: interaction.guildId,

						code,

						name,
						profileUrl: profileUrl(name),

						yesKey,
						noKey,

						veteran: interaction.customId === vetButtonId,
					});
				}

				if (interaction.customId === vetButtonId) {
					const req = await getGuildSetting(interaction.guildId, 'VeteranSectionRequirements');
					const requiredCompletes = Object.values(req);

					const data = await getUserSettings(interaction.user.id);
					const loggedCompletes: number[] = Reflect.get(data.stats, interaction.guildId);

					const dungeons = [
						'Oryx Sanctuary',
						'The Void',
						'The Shatters',
						'Cultist Hideout',
						'The Nest',
						'Fungal Cavern',
					];

					const missing = [];
					for (let i = 0; i < requiredCompletes.length; ++i) {
						if (loggedCompletes[i] >= requiredCompletes[i]) continue;
						missing.push(
							`${dungeons[i]} ${requiredCompletes[i] - loggedCompletes[i]} more required. (${
								loggedCompletes[i]
							} currently)`
						);
					}

					if (missing.length) {
						await interaction.editReply({ content: missing.join('\n') });
						return;
					}

					// TODO: add the roles and cleanup

					await interaction.editReply({ content: 'you are now vet verified' });
				}
				// #endregion

				// #region raiding
				const raid = this.manager.raids.find(
					(c) => c.controlPanelId === interaction.channelId || c.messageId === interaction.message.id
				);
				if (raid) {
					if (interaction.channelId === raid.controlPanelId) {
						const emoji = interaction.component.emoji?.name as string;
						if (emoji === '📝') {
							const prompter = new MessagePrompter(
								{
									content: stripIndents`
								Enter a new location for the raid.
								You have 15 seconds to respond. Type ${inlineCode('cancel')} to exit.
							`,
								},
								'message',
								{
									timeout: 15000,
								}
							);

							const res = await prompter.run(interaction.channel!, interaction.user).catch(async () => {
								await interaction.editReply({
									content: "You didn't enter a response in time, click the button to try again.",
								});
								await prompter.strategy.appliedMessage?.delete();
								return undefined;
							});

							if (!(res instanceof Message)) return;

							this.manager.raids.set(`raid:${raid.guildId}:${raid.messageId}`, {
								...raid,
								location: res.content,
							});
							await prompter.strategy.appliedMessage?.delete().catch(() => undefined);
							await interaction.editReply({ content: `Updated location to ${inlineCode(res.content)}` });

							const controlPanelChannel = interaction.client.channels.cache.get(raid.controlPanelId) as TextChannel;
							const message = controlPanelChannel.messages.cache.get(raid.controlPanelMessageId);

							if (res.deletable) await res.delete().catch(() => undefined);

							await message
								?.edit({
									embeds: [message.embeds[0].setFields({ name: 'Location', value: res.content })],
									components: message.components,
								})
								.catch(() => undefined);
						} else if (emoji === '🗺️') {
							const afkCheckChannel = interaction.client.channels.cache.get(raid.channelId) as TextChannel;
							const message = afkCheckChannel.messages.cache.get(raid.messageId);

							const embed = new Embed()
								.setColor(message?.embeds[0]?.color as number)
								.setThumbnail(message?.embeds[0]?.thumbnail?.url as string)
								.setDescription(
									stripIndents`
									${message?.embeds[0]?.description}

									The location for this run was revealed ${inlineCode(raid.location)}
								`
								)
								.setFooter({ text: raid.leaderName as string })
								.setTitle(inlineCode(raid.dungeon.full_name))
								.setTimestamp();

							await message?.edit({
								embeds: [embed],
							});
							await interaction.editReply({ content: 'Revealing location to everyone.' });
						} else if (emoji === '🛑') {
							await this.manager.emit('raidAbort', raid);
							await interaction.editReply({ content: 'Aborting afk check.' });
						} else if (emoji === '❌') {
							await this.manager.emit('raidEnd', raid);
							await interaction.editReply({ content: 'Ending afk check.' });
						}
					}

					if (interaction.channelId === raid.channelId) {
						if (interaction.customId === 'portal') {
							await interaction.editReply({ content: 'You successfully joined the raid.' });
						}
					}
				}
				// #endregion
			}

			// #region dm verification
			if (
				isDMChannel(interaction.channel) &&
				this.sessions.find((s) => [s.yesKey, s.noKey].indexOf(interaction.customId) !== -1) // eslint-disable-line @typescript-eslint/prefer-includes
			) {
				await interaction.deferReply({ ephemeral: true }).catch(() => undefined);

				const session = this.sessions.find((s) => s.userId === interaction.user.id)!;
				const res = await lookup(session.name, ['desc1', 'desc2', 'desc3', 'player_last_seen', 'rank']);

				if ('error' in res) {
					if (res.error === 'Invalid player name') {
						await interaction.editReply({ content: 'Invalid player name.' });
						return;
					}

					if (res.error === `${session.name} could not be found`) {
						await interaction.editReply({
							content: 'Could not find an account with that name or your profile is private.',
						});
						return;
					}

					await interaction.editReply({ content: 'An error occured while trying to fetch your profile, try again.' });
					return;
				}

				const roleId: string = await getGuildSetting(session.guildId, 'VerifiedRole');

				if (!(res.desc1 + res.desc2 + res.desc3).includes(session.code)) {
					const yesButton = new MessageButton().setCustomId(session.yesKey).setLabel('Done').setStyle('PRIMARY');
					const noButton = new MessageButton().setCustomId(session.noKey).setLabel('Cancel').setStyle('DANGER');

					await interaction.editReply({
						embeds: [
							new Embed()
								.setDescription(
									stripIndents`
								Code not found in description.
								
								Add the code to any line of your ${hyperlink('Realmeye description', profileUrl(session.name))}: ${codeBlock(
										'fix',
										session.code
									)}
								`
								)
								.setFooter({
									text: 'You may need to wait for your profile to properly sync. (1-2minutes). If this issue persists, contact a staff member.',
								}),
						],
						components: [new MessageActionRow().addComponents(yesButton, noButton)],
					});
					return;
				}

				const requirements = await getGuildSetting(session.guildId, 'MainSectionRequirements');
				if (requirements.private_location && res.player_last_seen !== 'hidden') {
					await interaction.editReply({ content: 'You must private your last seen location before continuing.' });
					return;
				}

				if (requirements.rank !== -1 && res.rank < requirements.rank) {
					await interaction.editReply({
						content: `The server requires you to have minimum ${requirements.rank} stars.`,
					});
					return;
				}

				const guild = interaction.client.guilds.cache.get(session.guildId);
				const member = guild?.members.cache.get(session.userId);

				const roleAdded = await member?.roles.add(roleId).catch(() => undefined);

				const responses = [];
				if (!roleAdded) responses.push('- An error occured while trying to add the role.');

				const nickname = await member?.setNickname(session.name).catch(() => undefined);
				if (!nickname) responses.push('- An error occured while trying to set your nickname.');

				await interaction.editReply(responses.length ? responses.join('\n') : 'You were successfully verified.');
			}
		}
		// #endregion
		// #endregion
	}
}
