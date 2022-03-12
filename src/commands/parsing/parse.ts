import type { Command } from '../../struct/Command';
import type { ChatInputCommandInteraction } from 'discord.js';

import { UnsafeEmbed, ActionRow, ComponentType } from 'discord.js';
import { codeBlock, hyperlink } from '@discordjs/builders';

import { parse } from '../../functions/parse/parse';
import { Stopwatch } from '@sapphire/stopwatch';

import { Buttons } from '../../util/constants';
import { haste } from '../../util/haste';

const clean = (str: string) => str.replace(/[^A-Za-z]/g, '');

export default class implements Command {
	public name = 'parse';
	public description = 'parse usernames from /who screenshot';
	public options = [
		{
			type: 1,
			name: 'vc',
			description: "Voice parse (basic parse + checks if they're in vc)",
			options: [
				{
					name: 'screenshot',
					description: 'screenshot to parse',
					type: 11,
					required: true,
				},
				{
					type: 7,
					name: 'voice_channel',
					description: 'Voice channel to use (leave blank to use your current voice channel)',
					required: false,
					channel_types: [2],
				},
			],
		},
		{
			type: 1,
			name: 'basic',
			description: 'Basic parse (only extracts IGNs from screenshot)',
			options: [
				{
					name: 'screenshot',
					description: 'screenshot to parse',
					type: 11,
					required: true,
				},
			],
		},
	];

	public async run(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		const timer = new Stopwatch();

		const m = await interaction.deferReply({ fetchReply: true });

		const attachment = interaction.options.getAttachment('screenshot', true);
		const voiceChannel = interaction.options.getChannel('voice_channel', false) ?? interaction.member.voice.channel;

		const url = attachment.url || attachment.proxyURL;
		const res = await parse(url).catch(async (reason) => {
			if (reason === 'Not an image') {
				await interaction.editReply({ content: 'Attachment was not an image.' });
				return undefined;
			}

			await interaction.editReply({ content: 'An error occured while trying to read screenshot.' });
			return undefined;
		});

		if (res) {
			const text = res.ParsedResults[0].ParsedText;
			const cleanNames = text.split(',').map((name) => name.trim());

			const embed = new UnsafeEmbed()
				.setDescription(`${hyperlink('Image url', url, 'Click to view image')}`)
				.setFooter({ text: `Took ${timer.toString()}` })
				.setImage(url);

			if (text) {
				embed.setTitle('Parsed screenshot results').setColor(0x34495e);

				const res = await haste('Raw screenshot content', text).catch(() => undefined);

				if (typeof res === 'object' && ('key' in res || 'url' in res)) {
					embed.setDescription(`${embed.description!} | ${hyperlink('View raw parse', res.url)}`);
				}

				embed.setDescription(`${embed.description!}\n${codeBlock(cleanNames.join(', '))}`);
			} else {
				embed.setTitle('Failed to parse screenshot').setColor(0xed4245);
			}

			await interaction.editReply({
				content: ' ',
				embeds: [embed],
				components: [new ActionRow().addComponents(Buttons.crashersButton)],
			});

			const collectedInteraction = await m
				.awaitMessageComponent({
					componentType: ComponentType.Button,
					filter: (i) => i.user.id === interaction.user.id,
					time: 60000 * 5,
				})
				.catch(async () => {
					await m.edit({ components: [new ActionRow().addComponents(Buttons.crashersButton.setDisabled(true))] });
					return undefined;
				});

			if (collectedInteraction?.customId === 'view_crashers') {
				if (interaction.options.getSubcommand(true) !== 'vc') {
					await collectedInteraction.reply({ content: 'No voice channel selected.', ephemeral: true });
					return undefined;
				}

				await collectedInteraction.deferReply({ ephemeral: true });

				if (voiceChannel?.isVoice()) {
					const names = [];
					for (const member of voiceChannel.members.values()) {
						if (member.id === interaction.user.id) continue;

						if (member.displayName.includes('|')) {
							const names_ = member.displayName.split('|');
							const cleaned = names_.map((name) => clean(name));
							console.log('cleaned', cleaned);

							names.push(...names_.map((name) => clean(name)));
						} else {
							names.push(clean(member.displayName));
						}
					}

					const missing = names.filter((name) => !cleanNames.includes(name));

					if (missing.length) {
						const embed = new UnsafeEmbed()
							.setColor(0x992d22)
							.setTitle('Possible crashers')
							.addFields({
								name: 'Not in voice channel',
								value: missing.join('\n'),
							});

						await collectedInteraction.editReply({ embeds: [embed] });
					} else {
						await collectedInteraction.editReply({ content: 'No crashers found.' });
					}
				}
			}
		}
	}
}
