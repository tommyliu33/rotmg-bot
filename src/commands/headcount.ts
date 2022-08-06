import type { guilds, PrismaClient } from '@prisma/client';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kPrisma, kRaids } from '../tokens';
import { isVeteran } from '#functions/raiding/isVeteran';
import { startRaid, RaidType } from '#functions/raiding/startRaid';
import { RaidManager } from '#struct/RaidManager';

@injectable()
export default class implements Command {
	public constructor(
		@inject(kRaids) public readonly raidManager: RaidManager,
		@inject(kPrisma) public readonly prisma: PrismaClient
	) {}

	private doc!: guilds;
	private isVet = false;

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		if (
			this.raidManager.raids.get(`${interaction.guildId}-${interaction.member.id}`)?.raidType === RaidType.Headcount
		) {
			await interaction.editReply('You already have an active headcount.');
			return;
		}

		const voiceChannelId = interaction.options.getString('voice_channel', true);
		const dungeon = this.raidManager.dungeons.get(interaction.options.getString('dungeon', true))!;

		await startRaid({
			dungeon,
			guildId: interaction.guildId,
			memberId: interaction.member.id,

			textChannelId: this.doc[this.isVet ? 'veteranRaiding' : 'mainRaiding'].statusChannelId,
			voiceChannelId,
			controlPanelId: this.doc[this.isVet ? 'veteranRaiding' : 'mainRaiding'].controlPanelChannelId,

			isVet: this.isVet,
			raidType: RaidType.Headcount,
		});
		await interaction.deleteReply();
	}

	public async autocomplete(interaction: AutocompleteInteraction<'cached'>) {
		const doc = await this.prisma.guilds.findFirstOrThrow({ where: { guildId: interaction.guildId } });
		this.doc = doc;

		const isVet = isVeteran(doc, interaction.channelId);
		this.isVet = isVet;

		// TODO: probably have a component for all of database stuff
		const { voiceChannelIds } = doc[isVet ? 'veteranRaiding' : 'mainRaiding'];

		const choices = [];
		for (const id of voiceChannelIds) {
			const channel = await interaction.guild.channels.fetch(id).catch(() => undefined);
			if (channel?.isVoiceBased()) choices.push({ name: channel.name, value: channel.id });
		}

		await interaction.respond(choices);
	}
}
