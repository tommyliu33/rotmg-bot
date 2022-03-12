import type { Event } from '../../struct/Event';
import {
	Events,
	Interaction,
	UnsafeEmbed,
	UnsafeButtonComponent,
	ActionRow,
	ButtonStyle,
	ComponentType,
} from 'discord.js';

import { codeBlock, hyperlink } from '@discordjs/builders';

import { logger } from '../../util/logger';
import { scrapePlayer } from 'realmeye-scrape';

import { nanoid } from 'nanoid';
import { getGuildSetting } from '../../functions/settings/settings';
import { messageCountdown } from '../../functions/messages/messageCountdown';

const profileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

export default class implements Event {
	public name = 'Verification interaction handling';
	public event = Events.InteractionCreate;

	public async run(interaction: Interaction) {
		if (!interaction.isModalSubmit() || !interaction.inCachedGuild()) return;

		logger.info(
			`${interaction.user.tag} (${interaction.user.id}) started verification in ${interaction.guild.name} (${interaction.guildId})`
		);

		await interaction.deferReply({ ephemeral: true });

		const name = interaction.fields.getTextInputValue('name');

		const player = await scrapePlayer(name).catch(async (err) => {
			if (err === `Error: '${name}' has a private profile or does not exist`) {
				await interaction.editReply({ content: 'Profile was private or the player does not exist.' });
				return undefined;
			}

			console.log(err);
			await interaction.editReply({ content: 'Unexpected error while fetching player.' });

			return undefined;
		});

		if (player) {
			await interaction.editReply({ content: 'Check your DMs to continue.' });

			//const code = nanoid(12);
			const code = 'xXwZCabm3M8eeIs';

			const doneKey = nanoid();
			const cancelKey = nanoid();

			const doneButton = new UnsafeButtonComponent()
				.setCustomId(doneKey)
				.setLabel('Done')
				.setStyle(ButtonStyle.Primary);

			const cancelButton = new UnsafeButtonComponent()
				.setCustomId(cancelKey)
				.setLabel('Cancel')
				.setStyle(ButtonStyle.Danger);

			const dmChannel = await interaction.user.createDM();
			const embed = new UnsafeEmbed()
				// .setTitle(`${inlineCode(interaction.guild.name)} Verification`)
				.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() ?? '' })
				.setDescription(
					`Add the following code to any line of your ${hyperlink('Realmeye profile', profileUrl(name))} description
				
				${codeBlock('fix', code)}
				Click 'Done' to continue. Click 'Cancel' to cancel.
				`
				);

			const m = await dmChannel.send({
				embeds: [embed],
				components: [new ActionRow().addComponents(doneButton, cancelButton)],
			});
			messageCountdown(m, 50_000 * 6, 30_000);

			const collectedInteraction = await m
				.awaitMessageComponent({
					filter: (i) => i.user.id === interaction.user.id,
					componentType: ComponentType.Button,
					time: 60_000 * 5,
				})
				.catch(async () => {
					const comp = m.components.map((row) => {
						row.components.map((comp) => comp.setDisabled(true));
						return row;
					});

					await m.edit({ components: comp });
					return undefined;
				});

			if (collectedInteraction?.customId === doneKey) {
				await collectedInteraction.deferReply();
				const player = await scrapePlayer(name).catch(async (err) => {
					if (err === `Error: '${name}' has a private profile or does not exist`) {
						await interaction.editReply({ content: 'Profile was private or the player does not exist.' });
						return undefined;
					}

					return undefined;
				});

				if (!player) {
					await collectedInteraction.editReply('Could not fetch your Realmeye profile, try again.');
					return;
				}

				if (!player.description?.includes(code)) {
					await collectedInteraction.editReply('Code not found in description.');
					return;
				}

				const settings = await getGuildSetting(interaction.guildId, 'main_section');
				const roleId = settings.user_role;

				const res = await interaction.member.roles.add(roleId).catch(async (err) => {
					await interaction.editReply('Failed to add the role');
					console.log('error from interaction create', err);
					return undefined;
				});

				if (res) await collectedInteraction.editReply('You are now verified!');
			} else if (collectedInteraction?.customId === cancelKey) {
				await collectedInteraction.update({ content: ' ', embeds: [], components: [] });
			}
		}
	}
}
