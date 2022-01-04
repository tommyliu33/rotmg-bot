import type { CommandInteraction } from 'discord.js';
import { Command, RaidManager } from '../../struct';

import { inAfkChannel, inVetChannel } from '../../util';
import { createRaidChannel, getGuildSetting } from '../../functions';

import { inject, injectable } from 'tsyringe';
import { kRaids } from '../../tokens';

@injectable()
export default class implements Command {
	public name = 'channel';
	public description = 'For custom raiding voice channels';
	public options = [
		{
			name: 'create',
			description: 'Create a custom raiding channel.',
			type: 1,
			options: [
				{
					name: 'name',
					description: 'Name of the channel',
					type: 3,
					required: true,
				},
			],
		},
		{
			name: 'close',
			description: 'Shut down your raiding channel',
			type: 1,
		},
		{
			name: 'lock',
			description: 'Prevents users from joining the channel',
			type: 1,
		},
		{
			name: 'unlock',
			description: 'Allows users to join the channel',
			type: 1,
		},
		{
			name: 'cap',
			description: 'Modify the user cap for the channel',
			type: 1,
			options: [
				{
					name: 'limit',
					description: 'The new channel cap (0-99)',
					type: 4,
					min_value: 0,
					max_value: 99,
					required: true,
				},
			],
		},
	];

	public constructor(@inject(kRaids) public readonly manager: RaidManager) {}

	public async execute(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });

		const subcommand = interaction.options.getSubcommand();

		if (
			['close', 'unlock', 'lock', 'cap'].includes(subcommand) &&
			!this.manager.channels.has(`guild:${interaction.guildId}channel:${interaction.user.id}`)
		) {
			await interaction.editReply({
				content: 'Create a channel first.',
			});
			return;
		}

		if (subcommand === 'create') {
			await inAfkChannel(interaction.guildId, interaction.channelId);

			if (this.manager.channels.has(`channel:${interaction.user.id}`)) {
				await interaction.editReply({
					content: 'Close your existing channel before starting another.',
				});
				return;
			}

			const veteran = await inVetChannel(interaction.guildId, interaction.channelId);
			const roleId = await getGuildSetting(interaction.guildId, veteran ? 'VeteranRole' : 'VerifiedRole');

			const channelName = interaction.options.getString('name', true).substring(0, 100);
			const channel = await createRaidChannel(interaction.guild, channelName, veteran)!;

			const member = channel.guild.members.cache.get(interaction.user.id);

			this.manager.emit('channelStart', {
				name: channel.name,

				guildId: interaction.guildId,
				channelId: interaction.channelId,
				voiceChannelId: channel.id,

				leaderId: interaction.user.id,
				leaderName: member?.displayName,
				leaderTag: interaction.user.tag,

				roleId: roleId,

				state: 'LOCKED',
			});
			await interaction.editReply({ content: 'Created your channel.' });
		}

		const channel = this.manager.channels.get(`guild:${interaction.guildId}channel:${interaction.user.id}`)!;
		if (subcommand === 'close') {
			this.manager.channels.set(`guild:${interaction.guildId}channel:${interaction.user.id}`, {
				...channel,
				state: 'CLOSED',
			});
			this.manager.emit('channelClose', { ...channel, state: 'CLOSED' });

			await interaction.editReply({ content: 'Closed your channel.' });
		}

		if (subcommand === 'unlock') {
			this.manager.channels.set(`guild:${interaction.guildId}channel:${interaction.user.id}`, {
				...channel,
				state: 'OPENED',
			});
			this.manager.emit('channelOpen', { ...channel, state: 'OPENED' });

			await interaction.editReply({ content: 'Opened your channel.' });
		}

		if (subcommand === 'lock') {
			if (channel.state === 'LOCKED') {
				await interaction.editReply({
					content: 'Channel is already locked.',
				});
				return;
			}

			this.manager.emit('channelLocked', {
				...channel,
				state: 'LOCKED',
			});
			this.manager.channels.set(`guild:${interaction.guildId}channel:${interaction.user.id}`, {
				...channel,
				state: 'LOCKED',
			});
			await interaction.editReply({ content: 'Locked your channel.' });
		}

		if (subcommand === 'cap') {
			const channel = this.manager.channels.get(`guild:${interaction.guildId}channel:${interaction.user.id}`);
			this.manager.emit('channelCapUpdate', channel!, interaction.options.getInteger('limit', true));
			await interaction.editReply({ content: 'Updated channel cap.' });
		}
	}
}
