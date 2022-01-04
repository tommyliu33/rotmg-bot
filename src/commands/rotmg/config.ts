import { Command } from '../../struct';
import type { CommandInteraction } from 'discord.js';

import { getGuildSetting, GuildSettings, setGuildSetting } from '../../functions';
import { Embed, inlineCode, channelMention, roleMention } from '@discordjs/builders';

import { inject, injectable } from 'tsyringe';
import { kRedis } from '../../tokens';
import type { Redis } from 'ioredis';

@injectable()
export default class implements Command {
	public name = 'config';
	public description = 'config command';
	public options = [
		{
			name: 'view',
			description: 'view the server config.',
			type: 1,
		},
		{
			name: 'edit',
			description: 'edit the server config.',
			options: [
				{
					name: 'verified_role',
					description: 'the main user role',
					type: 8,
				},
				{
					name: 'veteran_role',
					description: 'the veteran raider role',
					type: 8,
				},
				{
					name: 'raid_leader',
					description: 'the raid leader role',
					type: 8,
				},
				{
					name: 'vet_raid_leader',
					description: 'the veteran leader role',
					type: 8,
				},
				{
					name: 'afk_check',
					description: 'the afk check channel',
					type: 7,
					channel_types: [0],
				},
				{
					name: 'vet_afk_check',
					description: 'the veteran afk check channel',
					type: 7,
					channel_types: [0],
				},
				{
					name: 'main_section',
					description: 'the main raiding section',
					type: 7,
					channel_types: [4],
				},
				{
					name: 'veteran_section',
					description: 'the veteran raiding section',
					type: 7,
					channel_types: [4],
				},
				{
					name: 'log_channel',
					description: 'channel used for logs',
					type: 7,
					channel_types: [0],
				},
				{
					name: 'suspend_role',
					description: 'role used for suspensions',
					type: 8,
				},
			],
			type: 1,
		},
	];

	public constructor(@inject(kRedis) public readonly redis: Redis) {}

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply();

		const { guildId, options } = interaction;
		if (options.getSubcommand() === 'view') {
			const all = await getGuildSetting(guildId, 'All');
			console.log(all);

			const afkCheck = await getGuildSetting(guildId, 'AfkCheck');
			const vetAfkCheck = await getGuildSetting(guildId, 'VetAfkCheck');
			const logChannel = await getGuildSetting(guildId, 'LogChannel');

			const mainSection = await getGuildSetting(guildId, 'MainSection');
			const veteranSection = await getGuildSetting(guildId, 'VetSection');

			const suspendRole = await getGuildSetting(guildId, 'SuspendRole');
			const verifiedRole = await getGuildSetting(guildId, 'VerifiedRole');
			const veteranRole = await getGuildSetting(guildId, 'VeteranRole');

			const raidLeaderRole = await getGuildSetting(guildId, 'RaidLeaderRole');
			const vetLeaderRole = await getGuildSetting(guildId, 'VetRaidLeaderRole');

			const embed = new Embed()
				.setTitle(`${inlineCode(interaction.guild.name)} Config`)
				.setThumbnail(interaction.guild.iconURL({ dynamic: true }) ?? null)
				.setDescription('Use `/config edit` to change these values.')
				.addField({
					name: inlineCode('Afk check channel'),
					value: afkCheck ? channelMention(afkCheck) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Vet Afk check channel'),
					value: vetAfkCheck ? channelMention(vetAfkCheck) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Logs channel'),
					value: logChannel ? channelMention(logChannel) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Main section'),
					value: mainSection ? channelMention(mainSection) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Veteran section'),
					value: veteranSection ? channelMention(veteranSection) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Suspend role'),
					value: suspendRole ? roleMention(suspendRole) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Verified role'),
					value: verifiedRole ? roleMention(verifiedRole) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Veteran role'),
					value: veteranRole ? roleMention(veteranRole) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Raid leader role'),
					value: raidLeaderRole ? roleMention(raidLeaderRole) : '❌',
					inline: true,
				})
				.addField({
					name: inlineCode('Veteran leader role'),
					value: vetLeaderRole ? roleMention(vetLeaderRole) : '❌',
					inline: true,
				});

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		const options_ = options.data[0].options;
		if (!options_?.length) {
			await interaction.editReply({
				content: 'You need to provide a setting to edit.',
			});
			return;
		}

		let key: keyof GuildSettings;

		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let i = 0; i < options_.length; ++i) {
			const { name, value } = options_[i];
			console.log('name', name);

			switch (name) {
				// #region roles
				case 'verified_role':
					key = 'VerifiedRole';
					break;
				case 'veteran_role':
					key = 'VeteranRole';
					break;
				case 'raid_leader':
					key = 'RaidLeaderRole';
					break;
				case 'vet_raid_leader':
					key = 'VetRaidLeaderRole';
					break;
				case 'suspend_role':
					key = 'SuspendRole';
					break;
				// #endregion
				// #region sections
				case 'main_section':
					key = 'MainSection';
					break;
				case 'veteran_section':
					key = 'VetSection';
					break;
				// #endregion
				// #region channels
				case 'afk_check':
					key = 'AfkCheck';
					break;
				case 'vet_afk_check':
					key = 'VetAfkCheck';
					break;
				// #endregion
				case 'log_channel':
					key = 'LogChannel';
					break;
			}
			await setGuildSetting(guildId, key!, value);
		}

		await interaction.editReply({ content: 'Done.' });
	}
}
