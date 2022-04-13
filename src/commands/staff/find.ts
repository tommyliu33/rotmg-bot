import { memberNicknameMention, inlineCode, time } from '@discordjs/builders';
import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import type { Command } from '#struct/Command';
import { generateActionRows } from '#util/util';

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'] as const;

function generateMemberInformation(member: GuildMember) {
	const embed = new EmbedBuilder().setThumbnail(member.displayAvatarURL()).setDescription(`
	${inlineCode('Member')} ${memberNicknameMention(member.id)} (${member.id})
	${inlineCode('Roles')} ${member.roles.cache
		.filter((role) => role.id !== member.guild.id)
		.sort((a, b) => b.position - a.position)
		.map((role) => role.toString())
		.join(', ')}

	${inlineCode('Joined server')} ${time(member.joinedAt!, 'R')}
	${inlineCode('Account created')} ${time(member.user.createdAt, 'R')}
	`);

	return embed;
}

export default class implements Command {
	public name = 'find';
	public description = 'Find a member with the target name';
	public options = [
		{
			type: 3,
			name: 'name',
			description: 'Name to lookup',
			required: true,
		},
		{
			type: 5,
			name: 'hide',
			description: 'Hide command output',
			required: false,
		},
	];

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const name = interaction.options.getString('name', true);
		const hide = interaction.options.getBoolean('hide', false) ?? false;

		const m = await interaction.deferReply({ ephemeral: hide, fetchReply: true });

		const members = await interaction.guild.members.fetch().catch(async () => {
			await interaction.editReply('Failed to fetch server members.');
			return undefined;
		});

		if (!members) return;

		const members_ = members.filter((member) => {
			if (member.displayName.toLowerCase().includes(name.toLowerCase())) return true;
			if (member.displayName.toLowerCase() === name.toLowerCase()) return true;
			if (member.displayName.includes(' | ')) {
				const names = member.displayName.split(' | ');
				if (names.filter((name_) => name_.toLowerCase() === name.toLowerCase()).length > 0) return true;
			}

			return false;
		});

		if (members_.size === 1) {
			const member = members_.first()!;
			const embed = generateMemberInformation(member);

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		const embed = new EmbedBuilder();
		if (members_.size > 10) {
			embed.setDescription('Too many members found, narrow your search.');
			await interaction.editReply({
				embeds: [embed],
			});
			return;
		}

		embed.setDescription('Multiple matches found, manual selection required\n');

		const buttons = [];
		for (let i = 0; i < members_.size; ++i) {
			buttons.push(
				new ButtonBuilder().setEmoji({ name: emojis[i] }).setCustomId(i.toString()).setStyle(ButtonStyle.Primary)
			);

			const member = members_.at(i)!;
			embed.data.description += `\n${inlineCode((i + 1).toString())}. ${member.toString()} - ${member.id}`;
		}

		await interaction.editReply({ embeds: [embed.toJSON()], components: generateActionRows(...buttons) });

		const collectedInteraction = await m
			.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id,
				componentType: ComponentType.Button,
				time: 60_000,
			})
			.catch(async () => {
				await interaction.editReply({ components: [] });
				return undefined;
			});

		if (collectedInteraction?.customId) {
			const index = Number(collectedInteraction.customId);
			const member = members_.at(index)!;

			const embed = generateMemberInformation(member);
			await collectedInteraction.update({ embeds: [embed.toJSON()], components: [] });
		}
	}
}
