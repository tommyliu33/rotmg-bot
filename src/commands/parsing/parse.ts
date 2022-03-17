import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { codeBlock, hyperlink } from '@discordjs/builders';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';

import { parse } from '../../functions/parse/parse';
import { Stopwatch } from '@sapphire/stopwatch';

import { haste } from '../../util/haste';
import { nanoid } from 'nanoid';
import { paginate } from '../../functions/paginate';

const clean = (str: string) => str.replace(/[^A-Za-z]/g, '').toLowerCase();

function getNames(array: string[]) {
	const names: string[] = [];

	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < array.length; ++i) {
		if (array[i].includes('|')) {
			const split = array[i].split('|');
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			names.push(...getNames(split).map((name) => clean(name)));
		} else {
			names.push(clean(array[i]));
		}
	}

	return names;
}

export default class implements Command {
	public name = 'parse';
	public description = 'Parse usernames from /who screenshot (may be unreliable)';
	public options = [
		{
			name: 'screenshot',
			description: 'screenshot to parse',
			type: 11,
			required: true,
		},
		{
			type: 7,
			name: 'voice_channel',
			description: 'Voice channel to use (leave blank to use your current voice channel if available)',
			required: false,
			channel_types: [2],
		},
	];

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		const timer = new Stopwatch();

		const m = await interaction.deferReply({ fetchReply: true });
		const attachment = interaction.options.getAttachment('screenshot', true);
		const voiceChannel = interaction.options.getChannel('voice_channel', false) ?? interaction.member.voice.channel;

		await interaction.editReply('Starting parse (if this takes too long, it most likely failed)');

		const url = attachment.url || attachment.proxyURL;
		const res = await parse(url).catch(async (err) => {
			if (err instanceof Error) {
				if (err.message === 'Not an image') {
					await interaction.editReply({ content: 'Attachment was not an image.' });
					return undefined;
				}

				if (err.message === 'Headers Timeout Error') {
					await interaction.editReply({ content: 'Timed out trying to send request, try again.' });
					return undefined;
				}
			}

			await interaction.editReply({
				content: `An error occured while trying to read screenshot.\n${codeBlock(err)}`,
			});
			return undefined;
		});

		if (res) {
			await interaction.editReply('Parsing image results');
			timer.stop();

			const text = res.ParsedResults[0].ParsedText;
			const cleanedText = text.replace(/\r\n/g, ' ');
			const embed = new EmbedBuilder().setFooter({ text: `Took ${timer.toString()}` }).setImage(url);

			if (text) {
				embed.setTitle('Parsed screenshot results').setColor(0x34495e);

				const res = await haste('Raw screenshot content', text).catch(() => undefined);

				if (typeof res === 'object' && 'url' in res) {
					embed.setDescription(hyperlink('View raw', res.url));
				}

				embed.setDescription(`${embed.data.description!}\n${codeBlock(cleanedText)}`);
			} else {
				embed.setTitle('Failed to parse screenshot').setColor(0xed4245);
			}

			const options = {
				content: ' ',
				embeds: [embed],
				components: [],
			};

			const crashersKey = nanoid();
			const crashersButton = new ButtonBuilder()
				.setStyle(ButtonStyle.Primary)
				.setCustomId(crashersKey)
				.setLabel('View crashers')
				.setEmoji({
					name: '🕵️',
				});

			if (voiceChannel?.isVoice()) {
				// @ts-expect-error
				options.components = [new ActionRowBuilder<ButtonBuilder>().addComponents(crashersButton)];
			}

			await interaction.editReply(options);

			const collectedInteraction = await m
				.awaitMessageComponent({
					componentType: ComponentType.Button,
					filter: (i) => i.user.id === interaction.user.id,
					time: 60000 * 5,
				})
				.catch(async () => {
					await m.edit({
						components: [new ActionRowBuilder<ButtonBuilder>().addComponents(crashersButton.setDisabled(true))],
					});
					return undefined;
				});

			if (collectedInteraction?.customId === crashersKey && voiceChannel?.isVoice()) {
				await collectedInteraction.deferReply({ ephemeral: true });

				const filter = (m: GuildMember) => m.id !== interaction.user.id || !m.user.bot;

				const guildMembers = interaction.guild.members.cache
					.filter((m) => m.id !== interaction.user.id || !m.user.bot)
					.map((member) => member.displayName);
				const guildMemberNames = getNames(guildMembers);

				const voiceChannelMembers = voiceChannel.members.filter(filter).map((member) => member.displayName);
				const voiceChannelMemberNames = getNames(voiceChannelMembers);

				const embeds: EmbedBuilder[] = [];

				// eslint-disable-next-line @typescript-eslint/prefer-includes
				if (guildMemberNames.length && cleanedText.indexOf(':') !== -1) {
					const names = cleanedText.split(': ')[1];
					const split = names.split(', ');

					const inScreenshotButNotInVoiceChannel = split.filter((name) => !voiceChannelMemberNames.includes(name));
					if (inScreenshotButNotInVoiceChannel.length) {
						embeds.push(
							new EmbedBuilder()
								.setTitle('Players found in screenshot, but not in voice channel (Possible alts)')
								.setDescription(codeBlock(inScreenshotButNotInVoiceChannel.join('\n')))
								.setFooter({ text: 'Not 100% accurate!' })
						);
					}
				}

				// eslint-disable-next-line @typescript-eslint/prefer-includes
				if (voiceChannelMemberNames.length && cleanedText.indexOf(':') !== -1) {
					const names = cleanedText.split(': ')[1];
					const split = names.split(', ');

					const inVoiceChannelButNotInScreenshot = voiceChannelMemberNames.filter((name) => !split.includes(name));
					if (inVoiceChannelButNotInScreenshot.length) {
						embeds.push(
							new EmbedBuilder()
								.setTitle('Players in voice channel, but not found in screenshot (Possible alts)')
								.setDescription(codeBlock(inVoiceChannelButNotInScreenshot.join('\n')))
								.setFooter({ text: 'Not 100% accurate!' })
						);
					}
				}

				await paginate(collectedInteraction, embeds);
			}
		}
	}
}
