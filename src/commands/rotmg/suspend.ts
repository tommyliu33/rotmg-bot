import type { CommandInteraction } from 'discord.js';

import { Command } from '@struct';
import { generateCaseEmbed, getGuildSetting, SettingsKey } from '@functions';
import { isTextChannel } from '@sapphire/discord.js-utilities';

export default class implements Command {
	public name = 'suspend';
	public description = 'suspends a user.';

	public options = [
		{
			name: 'user',
			description: 'user to suspend.',
			type: 6,
			required: true,
		},
		{
			name: 'duration',
			description: 'duration of the suspension (ex: 3d)',
			type: 3,
			required: true,
		},
		{
			name: 'reason',
			description: 'reason for the suspension',
			type: 3,
			required: false,
		},
	];

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });

		const { guild, options } = interaction;

		const user = options.getUser('user', true);
		const target = await guild.members.fetch(user.id).catch(() => undefined);
		const member = await guild.members.fetch(interaction.user.id).catch(() => undefined);

		if (user.bot) {
			await interaction.editReply({ content: 'Cannot suspend a bot.' });
			return;
		}

		if (guild.ownerId !== member?.user.id && member!.roles.highest.position <= target!.roles.highest.position) {
			await interaction.editReply({ content: 'You cannot suspend this user.' });
			return;
		}

		if (guild.me!.roles.highest.position <= target!.roles.highest.position) {
			await interaction.editReply({ content: 'I cannot suspend this user.' });
			return;
		}

		const duration = options.getString('duration', true);
		const reason = options.getString('reason', false);

		const roleId: string = await getGuildSetting(interaction.guildId, SettingsKey.SuspendRole);
		const role = guild.roles.cache.get(roleId);
		if (!role) {
			await interaction.editReply({
				content: 'Could not find the suspended role.',
			});
			return;
		}

		await target?.roles.add(roleId);

		const logChannelId: string = await getGuildSetting(interaction.guildId, SettingsKey.LogChannel);
		const logChannel = guild.channels.cache.get(logChannelId);

		if (isTextChannel(logChannel)) {
			const embed = await generateCaseEmbed(member!, target!, duration, reason!);
			await logChannel.send({
				embeds: [embed],
			});
			await interaction.editReply({ content: 'Done.' });
		}

		// TODO: schedule jobs using Bree
	}
}
