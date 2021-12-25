import type { CommandInteraction } from 'discord.js';
import { Command } from '@struct';

import { Embed, inlineCode, codeBlock } from '@discordjs/builders';
import { stripIndents } from 'common-tags';

export default class implements Command {
	public name = 'verification_message';
	public description = "Sends an embed with the server's verification requirements for that section";

	public options = [
		{
			name: 'section',
			description: 'Section to send the message in',
			type: 3,
			choices: [
				{
					name: 'Main',
					value: 'main',
				},
				{
					name: 'Veteran',
					value: 'veteran',
				},
			],
			required: true,
		},
	];

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply();

		const section = interaction.options.getString('section', true);

		const embed = new Embed().setTitle(
			`${inlineCode(interaction.guild.name)}${section === 'veteran' ? ' Veteran' : ''} Verification`
		).setDescription(stripIndents`
			To verify for this server, you must meet the following:
			${codeBlock('css', stripIndents`- Private location`)}
			If you meet the requirements, click the button to continue.
		`);

		await interaction.deleteReply();
		await interaction.channel?.send({ embeds: [embed] });
	}
}
