import { Collection, Interaction, Message, MessageActionRow, MessageButton, MessageOptions } from 'discord.js';
import type { Command, Event } from '@struct';

import { inject, injectable } from 'tsyringe';
import { logger } from '../logger';
import { kCommands, kRedis } from '../tokens';
import type { Redis } from 'ioredis';

import { getGuildSetting, SettingsKey, lookup, getUserSettings } from '@functions';
import { MessagePrompter, isDMChannel } from '@sapphire/discord.js-utilities';

import { stripIndents } from 'common-tags';
import { Embed, inlineCode, hyperlink, codeBlock } from '@discordjs/builders';
import { profileUrl } from '@util';
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
// TODO: use redis caching for database calls

@injectable()
export default class implements Event {
	public name = 'interactionCreate';
	public sessions: Collection<string, VerificationSession>;

	public constructor(
		@inject(kCommands) public readonly commands: Map<string, Command>,
		@inject(kRedis) public readonly redis: Redis
	) {
		this.sessions = new Collection();
	}

	public async execute(interaction: Interaction) {
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

		if (interaction.isButton()) {
			if (interaction.inCachedGuild()) {
				const buttonIds = [
					await getGuildSetting(interaction.guildId, SettingsKey.MainVerificationButton),
					await getGuildSetting(interaction.guildId, SettingsKey.VeteranVerificationButton),
				];

				if (interaction.customId === buttonIds[0]) {
					await this.respond(interaction, { content: 'You have started verification. Check your DMs to continue.' });

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
						await this.respond(interaction, {
							content: "You didn't enter a response in time, click the button to restart.",
						});
						await prompter.strategy.appliedMessage?.delete();
						return undefined;
					});

					if (!(res instanceof Message)) return;

					if (res.content.toLowerCase() === 'cancel') {
						await prompter.strategy.appliedMessage?.delete();
						await this.respond(interaction, {
							content: 'You have exited verification, click the button to restart.',
						});

						return;
					}

					const name = res.content;
					const code = nanoid(15);

					//const code = 'olZMjp8p5yhmq';

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

						veteran: interaction.customId === buttonIds[1],
					});
				}

				if (interaction.customId === buttonIds[1]) {
					const requiredCompletes: number[] = [
						await getGuildSetting(interaction.guildId, SettingsKey.OryxSanctuary),
						await getGuildSetting(interaction.guildId, SettingsKey.TheVoid),
						await getGuildSetting(interaction.guildId, SettingsKey.TheShatters),
						await getGuildSetting(interaction.guildId, SettingsKey.CultistHideout),
						await getGuildSetting(interaction.guildId, SettingsKey.TheNest),
						await getGuildSetting(interaction.guildId, SettingsKey.FungalCavern),
					];

					await this.respond(interaction, { content: 'You have started veteran verification.' });

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
						await this.respond(interaction, { content: missing.join('\n') });
						return;
					}

					await this.respond(interaction, { content: 'you are now vet verified' });
				}
			}

			// For main verification only
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

				const roleId: string = await getGuildSetting(session.guildId, SettingsKey.MainUserRole);

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

				const privateLocation = await getGuildSetting(session.guildId, SettingsKey.PrivateLocation);
				if (privateLocation && res.player_last_seen !== 'hidden') {
					await interaction.editReply({ content: 'You must private your last seen location before continuing.' });
					return;
				}

				const rank: number = await getGuildSetting(session.guildId, SettingsKey.Rank);
				if (rank !== -1 && res.rank < rank) {
					await interaction.editReply({ content: `The server requires you to have minimum ${rank} stars.` });
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
	}

	private async respond(interaction: Interaction, ops: MessageOptions) {
		if (!interaction.isCommand() && !interaction.isButton()) return;

		if (interaction.replied || interaction.deferred) await interaction.editReply(ops);
		else await interaction.reply(ops);
	}
}
