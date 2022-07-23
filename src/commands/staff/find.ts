import { inlineCode, time, userMention } from '@discordjs/builders';
import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import type { CommandEntity } from '#components/CommandEntity';
import { CommandManager } from '#components/CommandManager';
import { generateActionRows } from '#util/components';

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'] as const;

function generateMemberInformation(member: GuildMember) {
	const embed = new EmbedBuilder()
		.setColor(member.displayColor)
		.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
		.setThumbnail(member.displayAvatarURL())
		.addFields(
			{
				name: 'Mention',
				value: userMention(member.id),
				inline: true,
			},
			{
				name: 'User Id',
				value: member.id,
				inline: true,
			},
			{
				name: 'Joined server',
				value: time(member.joinedAt!, 'R'),
				inline: false,
			},
			{
				name: 'Account created',
				value: time(member.user.createdAt, 'R'),
				inline: true,
			},
			{
				name: 'Roles',
				value: member.roles.cache
					.filter((role) => role.id !== member.guild.id)
					.sort((a, b) => b.position - a.position)
					.map((role) => role.toString())
					.join(', '),
			}
		);
	return embed;
}

export default class implements CommandEntity {
	public name = 'commands:find';
	public parent = CommandManager;

	public async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const name = interaction.options.getString('name', true);
		const hide = interaction.options.getBoolean('hide', false) ?? false;

		const m = await interaction.deferReply({ ephemeral: hide, fetchReply: true });

		const members = await interaction.guild.members.fetch({ query: name, limit: 10 }).catch(async () => {
			await interaction.editReply('Could not fetch members.');
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

		if (members_.size < 10) {
			const buttons = [];
			const description = ['Multiple matches found, manual selection required:', ''];
			for (let i = 0; i < members_.size; ++i) {
				buttons.push(
					new ButtonBuilder().setEmoji({ name: emojis[i] }).setCustomId(i.toString()).setStyle(ButtonStyle.Primary)
				);

				const member = members_.at(i)!;
				description.push(
					`${inlineCode((i + 1).toString())}. ${member.toString()} ${member.user.tag} ${inlineCode(member.id)}`
				);
			}

			embed.setDescription(description.join('\n'));
			await interaction.editReply({ embeds: [embed], components: generateActionRows(buttons) });

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

				await collectedInteraction.update({ embeds: [generateMemberInformation(member)], components: [] });
			}
			return;
		}

		await interaction.editReply({
			embeds: [embed.setDescription('Too many members found, narrow your search.')],
		});
	}
}
