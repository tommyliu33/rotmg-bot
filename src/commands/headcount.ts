import { Inject } from '@ayanaware/bento';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import type { CommandEntity } from '../components/CommandEntity';

import { CommandManager } from '../components/CommandManager';
import { RaidManager } from '../components/RaidManager';
import { type GuildDocument, Database } from '#components/Database';
import { isVeteran } from '#functions/raiding/isVeteran';
import { startRaid, RaidType } from '#functions/raiding/startRaid';

export default class implements CommandEntity {
	public name = 'commands:headcount';
	public parent = CommandManager;

	@Inject(RaidManager) private readonly raidManager!: RaidManager;
	@Inject(Database) private readonly database!: Database;

	private doc!: GuildDocument;
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

			textChannelId: this.doc[this.isVet ? 'veteran_raiding' : 'main_raiding'].status_channel_id,
			voiceChannelId,
			controlPanelId: this.doc[this.isVet ? 'veteran_raiding' : 'main_raiding'].control_panel_channel_id,

			isVet: this.isVet,
			raidType: RaidType.Headcount,
		});
		await interaction.deleteReply();
	}

	public async autocomplete(interaction: AutocompleteInteraction<'cached'>) {
		const doc = await this.database.getGuild(interaction.guildId);
		this.doc = doc;

		const isVet = isVeteran(doc, interaction.channelId);
		this.isVet = isVet;

		// TODO: probably have a component for all of database stuff
		const { voice_channel_ids } = doc[isVet ? 'veteran_raiding' : 'main_raiding'];

		const choices = [];
		for (const id of voice_channel_ids) {
			const channel = await interaction.guild.channels.fetch(id).catch(() => undefined);
			if (channel?.isVoiceBased()) choices.push({ name: channel.name, value: channel.id });
		}

		await interaction.respond(choices);
	}
}
