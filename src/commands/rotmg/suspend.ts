import type { CommandInteraction } from 'discord.js';

import type { Command } from '../../struct';
import { CaseType, createCase, generateCaseEmbed, getGuildSetting } from '../../functions';
import { isTextChannel } from '@sapphire/discord.js-utilities';
import { Duration } from '@sapphire/time-utilities';

export default class implements Command {
	public name = 'suspend';
	public description = 'suspends a user.';

	public options = [
		{
			name: 'user',
			description: 'User to suspend',
			type: 6,
			required: true,
		},
		{
			name: 'duration',
			description: 'Duration of the suspension (ex: 3d)',
			type: 3,
			required: true,
		},
		{
			name: 'reason',
			description: 'Reason for the suspension',
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
		if (isNaN(new Duration(duration).fromNow.getTime())) {
			await interaction.editReply({ content: 'Invalid suspension duration.' });
			return;
		}
		const reason = options.getString('reason', false);

		const roleId = await getGuildSetting(interaction.guildId, 'SuspendRole');
		const role = guild.roles.cache.get(roleId);
		if (!role) {
			await interaction.editReply({
				content: 'Could not find the suspended role.',
			});
			return;
		}

		await target?.roles.add(roleId).catch(async () => {
			await interaction.editReply({ content: 'I was unable to add the role for this user.' });
		});

		const logChannelId = await getGuildSetting(interaction.guildId, 'LogChannel');
		const logChannel = await guild.channels.fetch(logChannelId).catch(() => undefined);

		if (isTextChannel(logChannel)) {
			// TODO: function to create cases and save them in mongo
			const embed = await generateCaseEmbed(member!, target!, duration, reason!);
			await logChannel.send({
				embeds: [embed],
			});
		}

		await createCase(interaction.guildId, {
			action: CaseType.Suspension,
			actionProcessed: false,

			date: Date.now(),
			duration,

			guildId: interaction.guildId,
			userId: target!.user.id,
			moderatorId: interaction.user.id,

			logChannelId,
			reason: reason ?? 'No reason provided',
		});

		await interaction.editReply({ content: 'Done.' });
	}
}
