import { getComponent } from '@ayanaware/bento';
import { ellipsis } from '@chatsift/discord-utils';
import { inlineCode, time, userMention } from '@discordjs/builders';
import type { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import type { CommandEntity } from '#components/CommandEntity';
import { CommandManager } from '#components/CommandManager';
import { Database } from '#components/Database';
import { generateActionRows } from '#util/components';

const dungeonNames = [
	'Oryx Sanctuary',
	'The Void',
	'The Shatters',
	'Cultist Hideout',
	'The Nest',
	'Fungal/Crystal Cavern',
];
const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'] as const;

async function generateMemberInformation(member: GuildMember) {
	const database = getComponent(Database);
	const user = await database.getUser(member.user.id);
	const guildStats = user.guilds.find((g) => g.guild_id === member.guild.id);

	const roles = member.roles.cache
		.filter((r) => r.id !== member.guild.id)
		.sort((b, a) => b.position - a.position)
		.map((r) => r.toString())
		.join(', ');

	const embed = new EmbedBuilder()
		.setColor(member.displayColor)
		.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
		.setThumbnail(member.displayAvatarURL()).setDescription(`
${userMention(member.id)} ${member.id}

Joined at ${time(member.joinedAt!, 'R')}
Created at ${time(member.user.createdAt, 'R')}

Roles ${ellipsis(roles, 2046)}
		`);

	if (guildStats?.dungeon_completions) {
		embed.addFields({
			name: 'Logged completions',
			value: guildStats.dungeon_completions.map((n, i) => `${dungeonNames[i]}: ${n}`).join('\n'),
		});
	}

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
			await interaction.editReply('I could not fetch server members.');
			return undefined;
		});
		if (!members) return;

		const filteredMembers = members.filter((member) => {
			if (member.displayName.toLowerCase().includes(name.toLowerCase())) return true;
			if (member.displayName.toLowerCase() === name.toLowerCase()) return true;
			if (member.displayName.includes(' | ')) {
				const names = member.displayName.split(' | ');
				if (names.filter((name_) => name_.toLowerCase() === name.toLowerCase()).length > 0) return true;
			}

			return false;
		});

		if (filteredMembers.size > 10) {
			await interaction.editReply('Too many members found, limit your search query.');
			return;
		}

		if (filteredMembers.size === 1) {
			const member = filteredMembers.first()!;
			await interaction.editReply({ embeds: [await generateMemberInformation(member)] });
			return;
		}

		const embed = new EmbedBuilder();

		if (filteredMembers.size < 10) {
			const buttons = [];
			const description = ['Multiple matches found, manual selection required:', ''];
			for (let i = 0; i < filteredMembers.size; ++i) {
				buttons.push(
					new ButtonBuilder().setEmoji({ name: emojis[i] }).setCustomId(i.toString()).setStyle(ButtonStyle.Primary)
				);

				const member = filteredMembers.at(i)!;
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
				const member = filteredMembers.at(Number(collectedInteraction.customId))!;
				await collectedInteraction.update({ embeds: [await generateMemberInformation(member)], components: [] });
			}
		}
	}
}
