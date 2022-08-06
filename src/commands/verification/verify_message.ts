import { ButtonBuilder, EmbedBuilder, inlineCode } from '@discordjs/builders';
import type { PrismaClient } from '@prisma/client';
import { ButtonStyle } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { kPrisma } from '../../tokens';
import type { Command } from '#struct/Command';
import { generateActionRows } from '#util/components';

@injectable()
export default class implements Command {
	public constructor(@inject(kPrisma) public readonly prisma: PrismaClient) {}

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		const section = interaction.options.getString('section', true) as 'mainRaiding' | 'veteranRaiding';
		const button = interaction.options.getBoolean('button', false) ?? false;

		const doc = await this.prisma.guilds.findFirst({ where: { guildId: interaction.guildId } });
		if (!doc) return;

		const { verificationRequirements, verificationChannelId } = doc[section];

		const embed = new EmbedBuilder().setTitle(`${inlineCode(interaction.guild.name)} ${section} Section Verification`);

		const channel = await interaction.guild.channels.fetch(verificationChannelId).catch(async () => {
			await interaction.editReply('The verification channel could not be found.');
			return undefined;
		});

		if (!channel?.isTextBased()) return;
		if (!verificationRequirements.verificationMessage) {
			await interaction.editReply('There is no verification message.');
			return;
		}

		const verifyKey = section === 'veteranRaiding' ? 'veteran_verification' : 'main_verification';
		const verifyButton = new ButtonBuilder().setCustomId(verifyKey).setStyle(ButtonStyle.Primary).setLabel('Verify');

		const m = await channel.send({
			embeds: [embed.setDescription(verificationRequirements.verificationMessage).toJSON()],
			components: button ? generateActionRows([verifyButton]) : [],
		});

		await interaction.editReply(`Done. See it here:\n${m.url}`);
	}
}
