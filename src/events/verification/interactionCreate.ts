import type { Event } from '../../struct/Event';
import {
	Events,
	Interaction,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
	ComponentType,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';

// TODO: import from d.js when
import { UnsafeEmbedBuilder, codeBlock, hyperlink } from '@discordjs/builders';

import { logger } from '../../util/logger';
import { scrapePlayer } from '@toommyliu/realmeye-scraper';

import { nanoid } from 'nanoid';
import { getGuildSetting } from '../../functions/settings/getGuildSetting';
import { messageCountdown } from '../../functions/messages/messageCountdown';

const profileUrl = (name: string) => `https://www.realmeye.com/player/${name}`;

export default class implements Event {
	public name = 'Verification interaction handling';
	public event = Events.InteractionCreate;

	public async run(interaction: Interaction<'cached'>) {
		const isButton = interaction.isButton();
		const isModal = interaction.isModalSubmit();

		return;

		// if (isButton || isModal) {
		// 	await interaction.deferReply({ ephemeral: true });

		// 	const location = interaction.inGuild() ? interaction.guild.name : 'DMs';
		// 	const locationId = interaction.inGuild() ? interaction.guildId : 'DMs';

		// 	// TODO: fix faulty
		// 	logger.info(
		// 		`${interaction.user.tag} (${interaction.user.id}) started verification in ${location} (${locationId})`
		// 	);
		// }

		// // #region modal
		// if (isModal) {
		// 	const name = interaction.f	ields.getTextInputValue('name');

		// 	const player = await scrapePlayer(name).catch(async (err: Error) => {
		// 		if (err.message === 'Player not found') {
		// 			await interaction.editReply({ content: 'Your profile was private or the player does not exist.' });
		// 			return undefined;
		// 		}

		// 		await interaction.editReply({ content: 'Unexpected error while fetching player.' });
		// 		return undefined;
		// 	});

		// 	// TODO: streamline verification to one function
		// 	if (player) {
		// 		await interaction.editReply({ content: 'Check your DMs to continue.' });

		// 		console.log(player);

		// 		//const code = nanoid(12);
		// 		const code = 'xXwZCabm3M8eeIs';

		// 		const doneKey = nanoid();
		// 		const cancelKey = nanoid();

		// 		const doneButton = new ButtonBuilder().setCustomId(doneKey).setLabel('Done').setStyle(ButtonStyle.Primary);
		// 		const cancelButton = new ButtonBuilder().setCustomId(cancelKey).setLabel('Cancel').setStyle(ButtonStyle.Danger);

		// 		const dmChannel = await interaction.user.createDM();
		// 		const embed = new UnsafeEmbedBuilder()
		// 			.setAuthor({
		// 				name: interaction.guild.name,
		// 				iconURL: interaction.guild.iconURL() ?? '',
		// 			})
		// 			.setDescription(
		// 				`Add the following code to any line of your ${hyperlink('Realmeye profile', profileUrl(name))} description
					
		// 			${codeBlock('fix', code)}
		// 			Click 'Done' to continue or 'Cancel' to cancel.
		// 			`
		// 			);

		// 		const m = await dmChannel.send({
		// 			embeds: [embed],
		// 			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(doneButton, cancelButton)],
		// 		});
		// 		messageCountdown(m, 50_000 * 6, 30_000);

		// 		const collectedInteraction = await m
		// 			.awaitMessageComponent({
		// 				filter: (i) => i.user.id === interaction.user.id,
		// 				componentType: ComponentType.Button,
		// 				time: 60_000 * 5,
		// 			})
		// 			.catch(async () => {
		// 				await m.edit({ components: [] });
		// 				return undefined;
		// 			});

		// 		if (collectedInteraction?.customId === doneKey) {
		// 			await collectedInteraction.deferReply();
		// 			const player = await scrapePlayer(name).catch(async (err: Error) => {
		// 				if (err.message === 'Player not found') {
		// 					await interaction.editReply({ content: 'Your profile was private or the player does not exist.' });
		// 					return undefined;
		// 				}

		// 				return undefined;
		// 			});

		// 			if (!player) {
		// 				await collectedInteraction.editReply('Could not fetch your Realmeye profile, try again.');
		// 				return;
		// 			}

		// 			if (!player.description?.includes(code)) {
		// 				await collectedInteraction.editReply('Code not found in description.');
		// 				return;
		// 			}

		// 			const settings = await getGuildSetting(interaction.guildId, 'main');
		// 			const roleId = settings.userRole;

		// 			try {
		// 				await interaction.member.roles.add(roleId);
		// 				await interaction.member.setNickname(player.name!);
		// 			} catch {}

		// 			await collectedInteraction.editReply(
		// 				'You are now verified! If you did not receive the role or a nickname, please contact a staff member.'
		// 			);
		// 		} else if (collectedInteraction?.customId === cancelKey) {
		// 			await collectedInteraction.update({ content: ' ', embeds: [], components: [] });
		// 		}
		// 	}
		// }
		// // #endregion

		// // #region button
		// if (isButton && interaction.customId === 'main_verification') {
		// 	const modal = new ModalBuilder()
		// 		.setTitle(`${interaction.guild.name} Verification`)
		// 		.setCustomId('verification_modal');

		// 	const nameForm = new TextInputBuilder()
		// 		.setCustomId('name')
		// 		.setLabel('What is your ingame name?')
		// 		.setStyle(TextInputStyle.Short);

		// 	await interaction.showModal(
		// 		modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameForm))
		// 	);
		// }
		// #endregion
	}
}
