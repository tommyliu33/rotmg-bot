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

	public declare channels: {
		'afk-check'?: TextChannel;
		'voice-channel'?: VoiceChannel;
		'control-panel'?: TextChannel;
		'control-panel-thread'?: ThreadChannel;
	};

	public declare channelIds: {
		'text-channel'?: string;
		'voice-channel'?: string;
		'control-panel'?: string;
		'control-panel-thread'?: string;
	};

	public declare messageIds: {
		'afk-check': string;
		'control-panel-thread': string;
	};

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

		this.channels = {};

		this.messageIds = {
			'afk-check': '',
			'control-panel-thread': '',
		};

		this.channelIds = {
			'text-channel': data.textChannelId,
			'voice-channel': data.voiceChannelId,
			'control-panel': '',
			'control-panel-thread': '',
		};

		this.dungeon = data.dungeon;

		this.guildId = data.guildId;
		this.memberId = data.memberId;
		this.textChannelId = data.textChannelId;
		this.voiceChannelId = data.voiceChannelId;
	}

	public async start() {
		const key = (await isVeteranSection(this.guildId, this.textChannelId)) ? 'veteran' : 'main';

		const { controlPanelChannelId } = await getGuildSetting(this.guildId, key);
		this.channelIds['control-panel'] = controlPanelChannelId;
		this.controlPanelChannelId = controlPanelChannelId;

		this.member = this.guild.members.cache.get(this.memberId)!;

		this.channels['afk-check'] = (await this.guild.channels.fetch(this.channelIds['text-channel']!)) as TextChannel;
		this.channels['voice-channel'] = (await this.guild.channels.fetch(this.voiceChannelId)) as VoiceChannel;

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

		const components = generateActionRows(participateButton, ...generateButtonsFromEmojis(this.dungeon.keys));

		const m = await this.channels['afk-check'].send({
			content: HEADCOUNT(
				this.dungeon.name,
				this.client.emojis.cache.get(this.dungeon.portal)?.toString() ?? '',
				this.channels['voice-channel'].name
			),
			allowedMentions: {
				parse: ['everyone'],
			},
			embeds: [embed],
			components,
		});
		this.messageIds['afk-check'] = m.id;

		this.message = m;
		this.messageId = m.id;

		await messageReact(
			m,
			this.dungeon.main.map((emoji) => emoji.emoji)
		);

		this.manager.headcounts.set(`${this.guildId}-${this.memberId}`, this);

		await this.createControlPanelThread();

		console.log(this);
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

		const msg = this.channels['control-panel-thread']!.messages.cache.get(this.messageIds['control-panel-thread']);
		await msg?.edit({ components: [] });

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
		await this.channels['control-panel-thread']!.setArchived(true);
	}

	private async createControlPanelThread() {
		const controlPanel = await this.guild.channels.fetch(this.channelIds['control-panel']!);
		if (!controlPanel?.isText()) return;

		this.channels['control-panel'] = controlPanel;
		this.channelIds['control-panel'] = controlPanel.id;

		this.channels['control-panel-thread'] = await this.channels['control-panel'].threads.create({
			name: `${this.member.displayName}'s ${this.dungeon.name} Headcount`,
		});
		this.channelIds['control-panel-thread'] = this.channels['control-panel-thread'].id;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: this.member.displayName,
				iconURL: this.member.displayAvatarURL(),
			})
			.setDescription('🛑 - Abort headcount\n❌ - End headcount');

		const m = await this.channels['control-panel-thread']!.send({
			embeds: [embed.toJSON()],
			components: generateActionRows(abortButton, endButton),
		});
		this.messageIds['control-panel-thread'] = m.id;

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
