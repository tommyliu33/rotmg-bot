import { channelMention, Embed, inlineCode } from '@discordjs/builders';
import { createControlPanelChannel } from '../functions';
import EventEmitter from '@tbnritzdoge/events';
import { stripIndents } from 'common-tags';
import { Collection } from '@discordjs/collection';

import { Client, EmojiResolvable, MessageButton, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import type { Dungeon } from '../dungeons';

import { inject, injectable } from 'tsyringe';
import { kClient, kRedis } from '../tokens';
import type { Redis } from 'ioredis';

import { toTitleCase } from '@sapphire/utilities';
import { createPartitionedMessageRow } from '@sapphire/discord.js-utilities';
import { nanoid } from 'nanoid';
import { inVetChannel } from '../util/';

@injectable()
export class RaidManager extends EventEmitter {
	public readonly headcounts: Collection<string, Headcount>;
	public readonly raids: Collection<string, Raid>;
	public readonly channels: Collection<string, Channel>;
	public constructor(
		@inject(kRedis) public readonly redis: Redis,
		@inject(kClient) public readonly client: Client<true>
	) {
		super();

		this.headcounts = new Collection();
		this.raids = new Collection();
		this.channels = new Collection();
	}

	// #region Afk check
	private async raidStart(raid: Omit<Raid, 'messageId' | 'controlPanelId' | 'controlPanelMessageId'>): Promise<void> {
		const { guildId, channelId, voiceChannelId, leaderName, leaderTag } = raid;

		const guild = this.client.guilds.cache.get(guildId);
		if (!guild) return;

		const voiceChannel = guild.channels.cache.get(voiceChannelId) as VoiceChannel;
		const channel = guild.channels.cache.get(channelId) as TextChannel;

		const { images, color, name, full_name } = raid.dungeon;

		const components = [];
		if (raid.dungeon.buttons) {
			for (const { emoji, customId, style } of raid.dungeon.buttons) {
				components.push(
					new MessageButton()
						.setEmoji(emoji as string)
						.setCustomId(customId)
						.setStyle(style)
				);
			}
		}

		const afkCheckEmbed = new Embed()
			.setDescription(
				stripIndents`
				Click here to join <#${voiceChannelId}> and then click ${raid.dungeon.portal}
				If you have a key and are willing to pop, click ${raid.dungeon.keys.map((k) => k.emote).join('')}
				
				To indicate class or gear choices, click on the button`
			)
			.setTimestamp()
			.setColor(color)
			.setFooter({ text: leaderName! })
			.setTitle(inlineCode(full_name))
			.setThumbnail(images[Math.floor(Math.random() * images.length)]);

		const m = await channel.send({
			content: `@here ${leaderName!} has started a ${toTitleCase(name)} raid in ${voiceChannel.name}.`,
			allowedMentions: {
				parse: ['everyone'],
			},
			embeds: [afkCheckEmbed],
			components: createPartitionedMessageRow(components),
		});

		const controlPanelChannel = await createControlPanelChannel(
			guild,
			leaderTag.replace('#', '-'),
			await inVetChannel(guildId, channelId)
		);
		await controlPanelChannel.setTopic('raid');

		const controlPanelEmbed = new Embed()
			.setTitle(`${inlineCode(leaderTag)} Control Panel`)
			.setFooter({ text: 'Headcount' })
			.setDescription(
				stripIndents`
			${inlineCode('Dungeon')} ${raid.dungeon.full_name}
			${inlineCode('Voice channel')} ${channelMention(voiceChannelId)}

			${inlineCode('Edit location')} 📝 
			${inlineCode('Reveal location')} 🗺️
			${inlineCode('Abort afk')} 🛑
			${inlineCode('End afk')} ❌
			`
			)
			.addField({ name: 'Location', value: 'Not set' })
			.setThumbnail(channel.guild.members.cache.get(raid.leaderId)?.displayAvatarURL({ dynamic: true }) as string);

		const components_ = [];
		for (const emoji of ['📝', '🗺️', '🛑', '❌']) {
			components_.push(new MessageButton().setEmoji(emoji).setStyle('PRIMARY').setCustomId(nanoid()));
		}

		const m_ = await controlPanelChannel.send({
			embeds: [controlPanelEmbed],
			components: createPartitionedMessageRow(components_),
		});

		this.raids.set(`raid:${guildId}:${m.id}`, {
			...raid,
			messageId: m.id,
			controlPanelId: controlPanelChannel.id,
			controlPanelMessageId: m_.id,
		});
	}

	private async raidEnd(raid: Raid) {
		const { channelId, voiceChannelId, messageId, dungeon, leaderName } = raid;

		const textChannel = this.client.channels.cache.get(channelId) as TextChannel;
		const msg = textChannel.messages.cache.get(messageId);

		const voiceChannel = this.client.channels.cache.get(voiceChannelId) as VoiceChannel;
		const embed = new Embed()
			.setColor(raid.dungeon.color)
			.setTimestamp()
			.setDescription(`${inlineCode(dungeon.full_name)} raid started in ${voiceChannel.name}`)
			.setFooter({ text: `The afk check was ended by ${leaderName as string}` });
		await msg?.edit({
			content: ' ',
			embeds: [embed],
			components: [],
		});
	}

	private async raidAbort(raid: Raid) {
		const { channelId, voiceChannelId, messageId, dungeon, leaderName } = raid;

		const textChannel = this.client.channels.cache.get(channelId) as TextChannel;
		const msg = textChannel.messages.cache.get(messageId);

		const voiceChannel = this.client.channels.cache.get(voiceChannelId) as VoiceChannel;
		const embed = new Embed()
			.setColor(0xc32135)
			.setTimestamp()
			.setDescription(`${inlineCode(dungeon.full_name)} raid was cancelled in ${voiceChannel.name}`)
			.setFooter({ text: `The afk check was aborted by ${leaderName as string}` });
		await msg?.edit({
			content: ' ',
			embeds: [embed],
			components: [],
		});
	}
	// #endregion
}

export interface Raid {
	dungeon: Dungeon;
	reacts: EmojiResolvable[];

	// this stores only limited reacts
	reacts_: {
		userId: Snowflake; // user id who reacted
		emoji: EmojiResolvable; // the emoji they reacted with
		state: 1 | 2 | 3; // whether they confirmed with the bot
		// TODO: enum for reacts confirmed
		// 1 for not confirmed but reacted
		// 2 for in progress - bot sent dm
		// 3 for yes - they said yes
	}[];

	location: string;

	guildId: Snowflake;
	channelId: Snowflake;
	voiceChannelId: Snowflake;
	controlPanelId: Snowflake;
	controlPanelMessageId: Snowflake;

	messageId: Snowflake; // the afk check msg id

	leaderId: Snowflake;
	leaderName: string;
	leaderTag: string;
}

export interface Channel
	extends Omit<
		Raid,
		'dungeon' | 'reacts' | 'reacted' | 'reacts_' | 'controlPanelId' | 'controlPanelMessageId' | 'location'
	> {
	name: string;

	roleId: Snowflake;

	state: 'LOCKED' | 'CLOSED' | 'OPENED';
}

// TODO: refactor: use partials from above
export interface Headcount {
	dungeon: Dungeon;
	channelId: string;
	guildId: string;
	leaderId: string;
	leaderName: string;
	leaderTag: string;
	messageId: string;
	controlPanelId: string;
	controlPanelMessageId: string;
}

export interface RaidEvents {
	headcount: [raid: Pick<Raid, 'dungeon' | 'channelId' | 'guildId' | 'leaderId' | 'leaderTag' | 'leaderName'>];

	raidStart: [raid: Omit<Raid, 'messageId' | 'controlPanelId' | 'controlPanelMessageId'>];
	raidEnd: [raid: Raid];
	raidAbort: [raid: Raid];

	channelStart: [channel: Omit<Channel, 'messageId' | 'location'>];
	channelDelete: [channel: Channel];
	channelClose: [channel: Channel];
	channelLocked: [channel: Channel];
	channelOpen: [channel: Channel];
	channelCapUpdate: [channel: Channel, cap: number];
}

// eslint-disable-next-line no-redeclare
export interface RaidManager {
	on<K extends keyof RaidEvents>(event: K, listener: (...args: RaidEvents[K]) => Promise<void>): this;
	on<S extends string | symbol>(event: Exclude<S, keyof RaidEvents>, listener: (...args: any[]) => Promise<void>): this;

	once<K extends keyof RaidEvents>(event: K, listener: (...args: RaidEvents[K]) => Promise<void>): this;
	once<S extends string | symbol>(
		event: Exclude<S, keyof RaidEvents>,
		listener: (...args: any[]) => Promise<void>
	): this;

	emit<K extends keyof RaidEvents>(event: K, ...args: RaidEvents[K]): boolean;
	emit<S extends string | symbol>(event: Exclude<S, keyof RaidEvents>, ...args: any[]): boolean;

	off<K extends keyof RaidEvents>(event: K, listener: (...args: RaidEvents[K]) => Promise<void>): this;
	off<S extends string | symbol>(
		event: Exclude<S, keyof RaidEvents>,
		listener: (...args: any[]) => Promise<void>
	): this;

	removeAllListeners<K extends keyof RaidEvents>(event?: K): this;
	removeAllListeners<S extends string | symbol>(event?: Exclude<S, keyof RaidEvents>): this;
}
