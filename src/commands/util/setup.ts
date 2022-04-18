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
	VerificationRequirementsCamel,
	VeteranVeterificationRequirements,
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
			userRole,
			leaderRole,
			statusChannelId,
			controlPanelChannelId,
			verificationChannelId,
			verificationRequirements,
		} = data;
		const voiceChannelIds = data.voiceChannelIds as unknown as string[];
		const baseEmbed = new EmbedBuilder().setColor('Greyple').addFields(
			{
				name: 'Channels',
				value: stripIndents`
${inlineCode('Status channel')} ${statusChannelId ? channelMention(statusChannelId) : 'Not set'}
${inlineCode('Control panel')} ${controlPanelChannelId ? channelMention(controlPanelChannelId) : 'Not set'}
${inlineCode('Voice channels')} ${
					voiceChannelIds.length ? voiceChannelIds.map((id) => channelMention(id)).join(' ') : 'Not set'
				}`,
			},
			{
				name: 'Roles',
				value: stripIndents`
${inlineCode('User')} ${userRole ? roleMention(userRole) : 'Not set'}
${inlineCode('Leader')} ${leaderRole ? roleMention(leaderRole) : 'Not set'}`,
			}
		);

		if (section === 'main') {
			const { minRank, minChars, minFame, hiddenLocation } = verificationRequirements as VerificationRequirementsCamel;

			const embed = baseEmbed.addFields({
				name: 'Verification',
				value: stripIndents`
	${inlineCode('Channel')} ${verificationChannelId ? channelMention(verificationChannelId) : 'Not set'}
	${inlineCode('Min rank')} ${minRank ?? 0}
	${inlineCode('Min Chars')} ${minChars ?? 0}
	${inlineCode('Min fame')} ${minFame ?? 0}
	${inlineCode('Hidden location')} ${hiddenLocation ? 'Yes' : 'No'}
					`,
			});
			return embed;
		}

		const req = verificationRequirements as VeteranVeterificationRequirements;
		const embed = baseEmbed.addFields({
			name: 'Verification',
			value: stripIndents`
			${inlineCode('Channel')} ${verificationChannelId ? channelMention(verificationChannelId) : 'Not set'}
				${inlineCode('Dungeon completions')}
				${dungeonNames.map((name, i) => `**${name}**: ${Reflect.get(req.dungeonCompletions, i) as number}`).join('\n')}
				`,
		});

		if (data.categoryId) embed.setFooter({ text: `Category id: ${data.categoryId}` });

		return embed;
	}
}
