import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kRaids } from '../tokens';
import type { Command } from '#struct/Command';
import { Headcount } from '#struct/Headcount';
import type { RaidManager } from '#struct/RaidManager';

import { config } from '../util/config';
import { isVeteranSection } from '#raids/isVeteranSection';

@injectable()
export default class implements Command {
	public name = 'headcount';
	public description = 'Start a headcount';
	public options = [
		{
			type: 3,
			name: 'voice_channel',
			description: 'Voice channel to use',
			autocomplete: true,
			required: true,
		},
		{
			name: 'dungeon',
			description: 'The dungeon to run',
			type: 3,
			choices: [
				{ name: 'Oryx Sanctuary', value: 'o3' },
				{ name: 'The Void', value: 'void' },
				{ name: 'Fullskip Void', value: 'fsv' },
				{ name: 'The Shatters', value: 'shatters' },
				{ name: 'Cultist Hideout', value: 'cult' },
				{ name: 'The Nest', value: 'nest' },
				{ name: 'Fungal Cavern', value: 'fungal' },
			],
			required: true,
		},
	];

	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		if (this.manager.headcounts.has(`${interaction.guildId}-${interaction.member.id}`)) {
			await interaction.editReply('You already have an active headcount, abort to start another.');
			return;
		}

		const voiceChannelId = interaction.options.getString('voice_channel', true);
		const dungeon = this.manager.dungeonCache.get(interaction.options.getString('dungeon', true))!;

		const headcount = new Headcount({
			dungeon,
			guildId: interaction.guildId,
			memberId: interaction.member.id,

			textChannelId: interaction.channelId,
			voiceChannelId,
		});

		await headcount.begin();

		await interaction.deleteReply();
	}

	public async autocomplete(interaction: AutocompleteInteraction<'cached'>) {
		const isVet = isVeteranSection(config, interaction.channelId);
		const { voice_channel_ids } = config[isVet ? 'veteran_raiding' : 'main_raiding'];

		const response = [];
		for (const id of voice_channel_ids) {
			const channel = await interaction.guild.channels.fetch(id, { cache: true }).catch(() => undefined);
			if (channel?.isVoice()) response.push({ name: channel.name, value: id });
		}

		await interaction.respond(response);
	}
}
