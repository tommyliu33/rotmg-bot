import type { ChatInputCommandInteraction } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { kRaids } from '../tokens';
import type { Command } from '#struct/Command';
import type { RaidManager } from '#struct/RaidManager';

@injectable()
export default class implements Command {
	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });

		const key = `${interaction.guildId}-${interaction.member.id}`;

		const raid = this.manager.raids.get(key);
		if (!raid) {
			await interaction.editReply('No raid found.');
			return;
		}

		await raid.abort();
		await interaction.editReply('Raid aborted.');
	}
}
