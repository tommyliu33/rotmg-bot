import { CommandInteraction, MessageActionRow, MessageSelectMenu } from 'discord.js';
import { Command, RaidManager } from '../../struct';

import { awaitComponent, inAfkChannel, inVetChannel } from '../../util';
import { dungeons } from '../../dungeons';

import { kRaids } from '../../tokens';
import { inject, injectable } from 'tsyringe';

import { nanoid } from 'nanoid';
import { getGuildSetting } from '../../functions';

@injectable()
export default class implements Command {
	public name = 'afkcheck';
	public description = 'Starts an afk check';
	public options = [
		{
			name: 'dungeon',
			description: 'The dungeon to run for the raid',
			type: 3,
			choices: [
				{ name: 'Oryx Sanctuary', value: 'o3' },
				{ name: 'The Void', value: 'void' },
				{ name: 'The Shatters', value: 'shatters' },
				{ name: 'Cultist Hideout', value: 'cult' },
				{ name: 'The Nest', value: 'nest' },
				{ name: 'Fungal Cavern', value: 'fungal' },
			],
			required: true,
		},
	];

	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await inAfkChannel(interaction.guildId, interaction.channelId);

		const m = await interaction.deferReply({ ephemeral: true, fetchReply: true });

		const vet = await inVetChannel(interaction.guildId, interaction.channelId);
		let channelIds = await getGuildSetting(interaction.guildId, 'MainSectionVoiceChannels');
		if (vet) {
			channelIds = await getGuildSetting(interaction.guildId, 'VetSectionVoiceChannels');
		}

		// @ts-ignore
		const selectMenuOptions: [{ label: string; value: string }] = [];

		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let i = 0; i < channelIds.length; ++i) {
			const channel = await interaction.guild.channels.fetch(channelIds[i]);
			selectMenuOptions.push({
				label: channel?.name as string,
				value: channelIds[i],
			});
		}

		const selectMenuId = nanoid();
		const selectMenu = new MessageSelectMenu().setCustomId(selectMenuId).setMaxValues(1).setOptions(selectMenuOptions);

		await interaction.editReply({
			content: 'Select a voice channel for the raid.',
			components: [new MessageActionRow().addComponents(selectMenu)],
		});

		const collectedInteraction = await awaitComponent(interaction.client, m, {
			componentType: 'SELECT_MENU',
			filter: async (i) => {
				await i.deferUpdate();
				return i.user.id === interaction.user.id;
			},
			time: 60000,
		}).catch(async () => {
			await interaction.editReply({ content: 'You failed to select a voice channel, aborting.', components: [] });
			return undefined;
		});

		if (collectedInteraction) {
			const dungeon = dungeons[dungeons.findIndex((d) => d.name === interaction.options.getString('dungeon'))];
			const member = interaction.guild.members.cache.get(interaction.user.id);

			this.manager.emit('raidStart', {
				dungeon,
				reacts: [dungeon.portal, ...dungeon.keys.map((k) => k.emote), '❌'],
				reacts_: [],

				location: 'TBD',

				guildId: interaction.guildId,
				channelId: interaction.channelId,

				voiceChannelId: collectedInteraction.values[0],

				leaderId: interaction.user.id,
				leaderName: member?.displayName,
				leaderTag: interaction.user.tag,
			});
		}
	}
}
