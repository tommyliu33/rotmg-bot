import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kRaids } from '../tokens';
import { config } from '../util/config';
import type { Command } from '#struct/Command';
import { Raid, RaidType, isVeteranSection } from '#struct/Raid';
import type { RaidManager } from '#struct/RaidManager';

@injectable()
export default class implements Command {	
	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		if (this.manager.raids.get(`${interaction.guildId}-${interaction.member.id}`)?.type === RaidType.AfkCheck) {
			await interaction.editReply('You already have an active headcount, abort to start another.');
			return;
		}

		const voiceChannelId = interaction.options.getString('voice_channel', true);
		const dungeon = this.manager.dungeonCache.get(interaction.options.getString('dungeon', true))!;

		const raid = new Raid({
			dungeon,
			guildId: interaction.guildId,
			memberId: interaction.member.id,

			textChannelId: interaction.channelId,
			voiceChannelId,
			type: RaidType.AfkCheck,
		});

		await interaction.deleteReply();
		await raid.init();
	}

	public async autocomplete(interaction: AutocompleteInteraction<'cached'>) {
		const isVet = isVeteranSection(config, interaction.channelId);
		const { voice_channel_ids } = config[isVet ? 'veteran_raiding' : 'main_raiding'];

		const response = [];
		for (const id of voice_channel_ids) {
			const channel = await interaction.guild.channels.fetch(id, { cache: true }).catch(() => undefined);
			if (channel?.isVoiceBased()) response.push({ name: channel.name, value: id });
		}

		await interaction.respond(response);
	}
}
