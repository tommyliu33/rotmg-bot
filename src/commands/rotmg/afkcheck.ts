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
	public description = 'Start an afk check';
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

		// TODO: refactor voice channel selection
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

			// empty values will be filled by the event
			this.manager.emit('raidStart', {
				dungeon,
				guildId: interaction.guildId,
				channelId: interaction.channelId,
				leaderId: interaction.user.id,
				voiceChannelId: collectedInteraction.values[0],
				location: '',
				messageId: '',
				controlPanelId: '',
				controlPanelMessageId: '',
			});
		}
	}
}
