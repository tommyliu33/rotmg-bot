import type { CommandInteraction } from 'discord.js';
import type { Command } from '../../struct';

import { MessageActionRow, MessageButton } from 'discord.js'; // eslint-disable-line no-duplicate-imports
import { nanoid } from 'nanoid';

import { getGuildSetting, setGuildSetting } from '../../functions';
import { Embed, inlineCode, codeBlock } from '@discordjs/builders';
import { stripIndents } from 'common-tags';

export default class implements Command {
	public name = 'verify_message';
	public description = "Sends an embed with the server's verification requirements for that section";

	public options = [
		{
			name: 'section',
			description: 'The section requirements to use',
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

		const requirements: string[] = [];

		if (section === 'main') {
			const req = await getGuildSetting(interaction.guildId, 'MainSectionRequirements');

			if (req.private_location) requirements.push('- Private location');
			if (req.rank !== 0) requirements.push(`- ${req.rank} stars`);
		}

		if (section === 'veteran') {
			const req = await getGuildSetting(interaction.guildId, 'VeteranSectionRequirements');
			const required = Object.values(req);

			const dungeons = ['Oryx Sanctuary', 'The Void', 'The Shatters', 'Cultist Hideout', 'The Nest', 'Fungal Cavern'];

			for (let i = 0; i < required.length; ++i) {
				requirements.push(`${dungeons[i]} completes required : ${required[i]}`);
			}
		}

		const embed = new Embed().setTitle(
			`${inlineCode(interaction.guild.name)}${section === 'veteran' ? ' Veteran' : ''} Verification`
		).setDescription(stripIndents`
			To${section === 'veteran' ? ' veteran' : ''} verify for this server, you must meet the following:
			${codeBlock('diff', requirements.length ? requirements.join('\n') : 'n/a')}
			If you meet the requirements, click the button to continue.
		`);

		const buttonId = nanoid();
		await setGuildSetting(
			interaction.guildId,
			section === 'veteran' ? 'VeteranVerificationButton' : 'MainVerificationButton',
			buttonId
		);

		const button = new MessageButton().setCustomId(buttonId).setLabel('Verify').setStyle('PRIMARY');

		await interaction.deleteReply();
		await interaction.channel?.send({ embeds: [embed], components: [new MessageActionRow().addComponents(button)] });
	}
}
