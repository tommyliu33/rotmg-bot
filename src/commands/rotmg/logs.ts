import type { CommandInteraction } from 'discord.js';
import { Command } from '../../struct';

import { injectable, inject } from 'tsyringe';
import { kRedis } from '../../tokens';
import type { Redis } from 'ioredis';

import { Embed } from '@discordjs/builders';

@injectable()
export default class implements Command {
	public name = 'logs';
	public description = 'Displays the most recent logs for a specific action of a user';

	public options = [
		{
			name: 'view',
			description: 'View logs for a user',
			type: 1,
			options: [
				{
					name: 'type',
					description: 'Log type to use (stores from 5min ago)',
					type: 3,
					choices: [
						{
							name: 'Voice state (join, leave, deafen)',
							value: 'voiceState',
						},
					],
					required: true,
				},
				{
					name: 'user',
					description: 'User to target',
					type: 6,
					required: true,
				},
			],
		},
		{
			name: 'toggle',
			description: 'Toggle whether to store logs for an action',
			type: 1,
			options: [
				{
					name: 'type',
					description: 'Log type to use',
					type: 3,
					choices: [
						{
							name: 'Voice state (join, leave, deafen)',
							value: 'voiceState',
						},
					],
					required: true,
				},
			],
		},
	];

	public constructor(@inject(kRedis) public readonly redis: Redis) {}

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });

		const subcommand = interaction.options.getSubcommand(true);

		if (subcommand === 'view') {
			const user = interaction.options.getUser('user', true);
			if (user.bot) {
				await interaction.editReply({ content: 'Logs are only stored for users.' });
				return;
			}
			const logs = await this.redis.get(`voiceState:${interaction.guildId}:${user.id}`);
			if (!logs) {
				await interaction.editReply({ content: 'No logs found for this user.' });
				return;
			}

			const embed = new Embed()
				.setDescription(logs)
				.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) });
			await interaction.editReply({ embeds: [embed] });
		} else if (subcommand === 'toggle') {
			await interaction.reply('toggle');
		}
	}
}
