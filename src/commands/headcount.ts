import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { kRaids } from '../tokens';
import type { Command } from '#struct/Command';
import { isVeteranSection, Raid, RaidType } from '#struct/Raid';
import type { RaidManager } from '#struct/RaidManager';
import { guilds } from '#util/mongo';

@injectable()
export default class implements Command {
	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		if (this.manager.raids.get(`${interaction.guildId}-${interaction.member.id}`)?.type === RaidType.Headcount) {
			await interaction.editReply('You already have an active headcount, abort to start another.');
			return;
		}

		const doc = await guilds.findOne({ guild_id: interaction.guildId });

		const isVet = isVeteranSection(doc!, interaction.channelId);
		const voiceChannelId = interaction.options.getString('voice_channel', true);
		const dungeon = this.manager.dungeonCache.get(interaction.options.getString('dungeon', true))!;

		const raid = new Raid({
			dungeon,
			guildId: interaction.guildId,
			memberId: interaction.member.id,

			textChannelId: doc![isVet ? 'veteran_raiding' : 'main_raiding'].status_channel_id,
			voiceChannelId,

			type: RaidType.Headcount,
			doc: doc!,
		});

		await interaction.deleteReply();
		await raid.init();
	}

	public async autocomplete(interaction: AutocompleteInteraction<'cached'>) {
		const doc = await guilds.findOne({ guild_id: interaction.guildId });

		const isVet = isVeteranSection(doc!, interaction.channelId);
		const { voice_channel_ids } = doc![isVet ? 'veteran_raiding' : 'main_raiding'];

		const response = [];
		for (const id of voice_channel_ids) {
			const channel = await interaction.guild.channels.fetch(id, { cache: true }).catch(() => undefined);
			if (channel?.isVoiceBased()) response.push({ name: channel.name, value: id });
		}

		await interaction.respond(response);
	}
}
