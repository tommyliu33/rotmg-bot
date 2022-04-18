import type { ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '#struct/Command';

import { inlineCode, channelMention, roleMention } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';

import { paginate } from '#functions/paginate';
import { stripIndents } from 'common-tags';

import { container } from 'tsyringe';
import { kDatabase } from '../../tokens';
import type {
	Database,
	SectionType,
	VerificationRequirements,
	VeteranVerificationRequirements,
} from '#struct/Database';

const dungeonNames = ['Oryx Sanctuary', 'The Void', 'Cultist Hideout', 'The Nest', 'The Shatters', 'Fungal Cavern'];

export default class implements Command {
	public name = 'setup';
	public description = 'setup stuff.';
	public options = [
		{
			type: 1,
			name: 'view',
			description: 'view',
			options: [],
		},
		{
			type: 1,
			name: 'edit',
			description: 'edit',
			options: [],
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const cmd = interaction.options.getSubcommand(true);
		await interaction.deferReply({ ephemeral: cmd === 'view' });

		switch (cmd) {
			case 'view':
				await this.handleViewSubcommand(interaction);
				break;
			case 'edit':
				await this.handleEditSubcommand(interaction);
				break;
		}
	}

	private async handleViewSubcommand(interaction: ChatInputCommandInteraction<'cached'>) {
		if (!interaction.channel?.isText()) return;

		const embeds = [
			await this.generateSectionEmbed(interaction.guildId, 'main'),
			await this.generateSectionEmbed(interaction.guildId, 'veteran'),
		];

		await paginate(interaction, embeds);
	}

	private async handleEditSubcommand(interaction: ChatInputCommandInteraction<'cached'>) {}

	private async generateSectionEmbed(guildId: string, section: SectionType) {
		const db = container.resolve<Database>(kDatabase);
		const data = await db.getSection(guildId, section);

		const {
			user_role,
			leader_role,
			status_channel_id,
			control_panel_channel_id,
			verification_channel_id,
			verification_requirements,
		} = data;
		const voiceChannelIds = data.voice_channel_ids as unknown as string[];
		const baseEmbed = new EmbedBuilder().setColor('Greyple').addFields(
			{
				name: 'Channels',
				value: stripIndents`
${inlineCode('Status channel')} ${status_channel_id ? channelMention(status_channel_id) : 'Not set'}
${inlineCode('Control panel')} ${control_panel_channel_id ? channelMention(control_panel_channel_id) : 'Not set'}
${inlineCode('Voice channels')} ${
					voiceChannelIds.length ? voiceChannelIds.map((id) => channelMention(id)).join(' ') : 'Not set'
				}`,
			},
			{
				name: 'Roles',
				value: stripIndents`
${inlineCode('User')} ${user_role ? roleMention(user_role) : 'Not set'}
${inlineCode('Leader')} ${leader_role ? roleMention(leader_role) : 'Not set'}`,
			}
		);

		if (section === 'main') {
			const { min_rank, min_chars, min_fame, hidden_location } = verification_requirements as VerificationRequirements;

			const embed = baseEmbed.addFields({
				name: 'Verification',
				value: stripIndents`
	${inlineCode('Channel')} ${verification_channel_id ? channelMention(verification_channel_id) : 'Not set'}
	${inlineCode('Min rank')} ${min_rank ?? 0}
	${inlineCode('Min Chars')} ${min_chars ?? 0}
	${inlineCode('Min fame')} ${min_fame ?? 0}
	${inlineCode('Hidden location')} ${hidden_location ? 'Yes' : 'No'}
					`,
			});
			return embed;
		}

		const req = verification_requirements as VeteranVerificationRequirements;
		const embed = baseEmbed.addFields({
			name: 'Verification',
			value: stripIndents`
			${inlineCode('Channel')} ${verification_channel_id ? channelMention(verification_channel_id) : 'Not set'}
				${inlineCode('Dungeon completions')}
				${dungeonNames.map((name, i) => `**${name}**: ${Reflect.get(req.dungeon_completions, i) as number}`).join('\n')}
				`,
		});

		if (data.category_id) embed.setFooter({ text: `Category id: ${data.category_id}` });

		return embed;
	}
}
