import type { Client, Guild, GuildMember, Message, TextChannel, ThreadChannel, VoiceChannel } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ComponentType, EmbedBuilder, InteractionCollector } from 'discord.js';
import { container } from 'tsyringe';
import type { Dungeon, RaidManager } from './RaidManager';
import { messageReact } from '../../functions/messages/messageReact';
import { getGuildSetting } from '../../functions/settings/getGuildSetting';
import { kClient, kRaids } from '../../tokens';
import { abortButton, endButton, participateButton } from '#constants/buttons';
import { HEADCOUNT } from '#util/messages';
import { generateActionRows, generateButtonsFromEmojis, isVeteranSection, random } from '#util/util';

export class Headcount implements IHeadcount {
	public client = container.resolve<Client<true>>(kClient);
	public manager = container.resolve<RaidManager>(kRaids);

	public guild!: Guild;
	public member!: GuildMember;
	public message!: Message;
	public textChannel!: TextChannel;
	public voiceChannel!: VoiceChannel;

	public controlPanelChannel!: TextChannel;
	public controlPanelChannelId!: string;
	public controlPanelThreadChannel!: ThreadChannel;

	public guildId: string;
	public memberId: string;
	public messageId!: string;
	public textChannelId: string;
	public voiceChannelId: string;
	public dungeon: Dungeon;

	public constructor(data: Omit<IHeadcount, 'messageId'>) {
		this.guild = this.client.guilds.cache.get(data.guildId)!;

		this.dungeon = data.dungeon;

		this.guildId = data.guildId;
		this.memberId = data.memberId;
		this.textChannelId = data.textChannelId;
		this.voiceChannelId = data.voiceChannelId;
	}

	public async start() {
		const key = (await isVeteranSection(this.guildId, this.textChannelId)) ? 'veteran' : 'main';

		const { controlPanelChannelId } = await getGuildSetting(this.guildId, key);
		this.controlPanelChannelId = controlPanelChannelId;

		this.member = this.guild.members.cache.get(this.memberId)!;
		this.textChannel = (await this.guild.channels.fetch(this.textChannelId)) as TextChannel;
		this.voiceChannel = (await this.guild.channels.fetch(this.voiceChannelId)) as VoiceChannel;

		const embed = new EmbedBuilder()
			.setColor(this.dungeon.color)
			.setThumbnail(random(this.dungeon.images))
			.setAuthor({
				name: `Headcount started by ${this.member.displayName}`,
				iconURL: this.member.displayAvatarURL({ forceStatic: false }),
			})
			.setDescription(
				`If you want to participate in this raid, click 🤚
				
				If you have a key (${this.dungeon.keys
					.map((key) => this.client.emojis.cache.get(key.emoji)?.toString() ?? '')
					.join('')}) and are willing to pop, react to the corresponding button
				
				Otherwise, react to class/item choices that you are bringing`
			);

		const components = generateActionRows([participateButton, ...generateButtonsFromEmojis(this.dungeon.keys)]);

		const m = await this.textChannel.send({
			content: HEADCOUNT(
				this.dungeon.name,
				this.client.emojis.cache.get(this.dungeon.portal)?.toString() ?? '',
				this.voiceChannel.name
			),
			allowedMentions: {
				parse: ['everyone'],
			},
			embeds: [embed],
			components,
		});

		this.message = m;
		this.messageId = m.id;

		await messageReact(
			m,
			this.dungeon.main.map((emoji) => emoji.emoji)
		);

		this.manager.headcounts.set(`${this.guildId}-${this.memberId}`, this);

		await this.createControlPanelThread();
	}

	public async end() {
		const embed = new EmbedBuilder()
			.setDescription(`This ${this.dungeon.name} headcount was ended by the raid leader.`)
			.setColor(0xfee75c);

		await this.message.edit({
			content: ' ',
			components: [],
			embeds: [embed.toJSON()],
		});
		await this.message.reactions.removeAll().catch(() => undefined);

		const messages = await this.controlPanelThreadChannel.messages.fetchPinned().catch(() => undefined);
		const embedMessage = messages?.find((msg) => msg.embeds.length > 0 && msg.author.id === this.client.user.id);
		if (!embedMessage) return;

		await embedMessage.edit({ components: [] });
		this.manager.headcounts.delete(`${this.guildId}-${this.memberId}`);
	}

	public async abort() {
		const embed = new EmbedBuilder()
			.setDescription(`This ${this.dungeon.name} headcount was aborted by the raid leader.`)
			.setColor(0xed4245);

		await this.message.edit({
			content: ' ',
			components: [],
			embeds: [embed.toJSON()],
		});
		await this.message.reactions.removeAll().catch(() => undefined);
		await this.controlPanelThreadChannel.setArchived(true);
	}

	private async createControlPanelThread() {
		const controlPanel = await this.guild.channels.fetch(this.controlPanelChannelId).catch(() => undefined);
		if (!controlPanel?.isText()) return;

		this.controlPanelThreadChannel = await controlPanel.threads.create({
			name: `${this.member.displayName}'s ${this.dungeon.name} Headcount`,
		});

		const embed = new EmbedBuilder()
			.setAuthor({
				name: this.member.displayName,
				iconURL: this.member.displayAvatarURL(),
			})
			.setDescription('🛑 - Abort headcount\n❌ - End headcount');

		const m = await this.controlPanelThreadChannel.send({
			embeds: [embed.toJSON()],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(abortButton, endButton)],
		});

		await m.pin().catch(() => undefined);

		const collector = new InteractionCollector(this.client, {
			channel: this.controlPanelThreadChannel,
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === this.memberId,
		});
		collector.on('collect', async (collectedInteraction) => {
			if (!collectedInteraction.isButton()) return;

			await collectedInteraction.deferReply();
			if (collectedInteraction.customId === 'abort') {
				await this.abort();
				await collectedInteraction.editReply('Aborted headcount.');
			} else if (collectedInteraction.customId === 'end') {
				await this.end();
				await collectedInteraction.editReply('Ended headcount.');
			}
		});
	}
}

export interface IHeadcount {
	guildId: string;

	memberId: string;
	messageId: string;

	textChannelId: string;
	voiceChannelId: string;

	dungeon: Dungeon;
}
