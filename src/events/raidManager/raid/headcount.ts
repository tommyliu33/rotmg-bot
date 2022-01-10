import type { Event, RaidManager } from '../../../struct';
import { Client, MessageActionRow, MessageButton, TextChannel } from 'discord.js';

import { injectable, inject } from 'tsyringe';
import { kClient, kRaids } from '../../../tokens';

import { createControlPanelChannel } from '../../../functions';
import { inVetChannel } from '../../../util';

import { Embed, inlineCode, formatEmoji } from '@discordjs/builders';
import { oneLine, stripIndents } from 'common-tags';
import { nanoid } from 'nanoid';
import { random } from '../../../util/random';

@injectable()
export default class implements Event {
	public name = 'headcount';
	public emitter = 'raidManager';

	public constructor(
		@inject(kRaids) public readonly manager: RaidManager,
		@inject(kClient) public readonly client: Client<true>
	) {}

	public execute() {
		this.manager.on('headcount', async (raid) => {
			const guild = this.client.guilds.cache.get(raid.guildId)!;
			const member = guild.members.cache.get(raid.leaderId);

			const isVet = await inVetChannel(raid.guildId, raid.channelId);

			const controlPanel = await createControlPanelChannel(guild, raid.leaderTag.replace('#', '-'), isVet);
			const controlPanelEmbed = new Embed()
				.setTitle(`${inlineCode(raid.leaderTag)} Control Panel`)
				.setDescription(
					stripIndents`
			${inlineCode('Dungeon')} ${raid.dungeon.full_name}

			${inlineCode('Start afk check')} ✅
			${inlineCode('Abort headcount')} 🛑
			`
				)
				.setThumbnail(member?.displayAvatarURL({ dynamic: true }) as string);

			const row = new MessageActionRow().addComponents(
				new MessageButton().setStyle('PRIMARY').setEmoji('✅').setCustomId(nanoid()),
				new MessageButton().setStyle('PRIMARY').setEmoji('🛑').setCustomId(nanoid())
			);

			const cpMsg = await controlPanel.send({ embeds: [controlPanelEmbed], components: [row] });

			const { dungeon } = raid;

			const headCountEmbed = new Embed()
				.setTimestamp()
				.setColor(dungeon.color)
				.setTitle(inlineCode(dungeon.full_name))
				.setDescription(
					stripIndents`
				${formatEmoji(dungeon.buttons?.[0].emoji as string)} if you want to participate
			 	${formatEmoji(dungeon.buttons?.[1].emoji as string)} if you are willing to pop a key
				`
				)
				.setFooter({
					text: member?.displayName as string,
				});

			const row_ = new MessageActionRow().addComponents(
				new MessageButton()
					.setStyle('PRIMARY')
					.setEmoji(dungeon.buttons?.[0].emoji as string)
					.setCustomId(nanoid()),
				new MessageButton()
					.setStyle('PRIMARY')
					.setEmoji(dungeon.buttons?.[1].emoji as string)
					.setCustomId(nanoid())
			);

			const afkCheckChannel = guild.channels.cache.get(raid.channelId) as TextChannel;
			const afkCheckMsg = await afkCheckChannel.send({
				content: oneLine`@here Headcount for ${inlineCode(dungeon.full_name)} started by
					${member?.displayName as string}`,
				embeds: [headCountEmbed],
				components: [row_],
				allowedMentions: {
					parse: ['everyone'],
				},
			});

			// if converted to afk check -> delete under this key
			this.manager.headcounts.set(`headcount:${guild.id}:${afkCheckMsg.id}`, {
				...raid,
				messageId: afkCheckMsg.id,
				controlPanelId: controlPanel.id,
				controlPanelMessageId: cpMsg.id,
			});
		});
	}
}
