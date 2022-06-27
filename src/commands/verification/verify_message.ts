import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, inlineCode } from '@discordjs/builders';
import { toTitleCase } from '@sapphire/utilities';
import { ButtonStyle } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction } from 'discord.js';
import { config } from '../../util/config';
import type { Command } from '#struct/Command';


export default class implements Command {
	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		const section = interaction.options.getString('section', true) as 'main_raiding' | 'veteran_raiding';
		const button = interaction.options.getBoolean('button', false) ?? false;

		const { verification_requirements, verification_channel_id } = config[section];

		const embed = new EmbedBuilder().setTitle(
			`${inlineCode(interaction.guild.name)} ${toTitleCase(section)} Section Verification`
		);

		const channel = await interaction.guild.channels.fetch(verification_channel_id).catch(async () => {
			await interaction.editReply('The verification channel could not be found.');
			return undefined;
		});

		if (!channel?.isTextBased()) return;
		if (!verification_requirements.verification_message) {
			await interaction.editReply('There is no set verification message to display.');
			return;
		}

		// TODO: refactor

		const verifyKey = section === 'veteran_raiding' ? 'veteran_verification' : 'main_verification';
		const verifyButton = new ButtonBuilder().setCustomId(verifyKey).setStyle(ButtonStyle.Primary).setLabel('Verify');

		const opts: { components: any[] } = { components: [] };
		if (button) {
			opts.components = [new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton)];
		}

		const m = await channel.send({
			embeds: [embed.setDescription(verification_requirements.verification_message).toJSON()],
			...opts,
		});

		await interaction.editReply(`Done. See it here:\n${m.url}`);
	}
}
