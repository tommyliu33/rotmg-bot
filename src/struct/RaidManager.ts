import { Embed, inlineCode, time } from '@discordjs/builders';
import { createChannel, react, getGuildSetting, SettingsKey } from '@functions';
import EventEmitter from '@tbnritzdoge/events';
import { stripIndents } from 'common-tags';
import { Collection } from '@discordjs/collection';

import type { EmojiResolvable, Snowflake, TextChannel, VoiceChannel } from 'discord.js';
import type { Dungeon } from '../dungeons';

import { inject, injectable } from 'tsyringe';
import { kClient, kRedis } from '../tokens';
import type { Redis } from 'ioredis';
import type { Bot } from '@struct';

import { toTitleCase } from '@sapphire/utilities';

@injectable()
export class RaidManager extends EventEmitter {
	public readonly raids: Collection<string, Raid>;
	public readonly channels: Collection<string, Channel>;
	public constructor(@inject(kRedis) public readonly redis: Redis, @inject(kClient) public readonly client: Bot) {
		super();

		this.raids = new Collection();
		this.channels = new Collection();

		this.on('raidStart', this.raidStart.bind(this));
		this.on('raidEnd', this.raidEnd.bind(this));

		this.on('channelStart', this.channelStart.bind(this));
		this.on('channelOpen', this.channelOpen.bind(this));
		this.on('channelClose', this.channelClose.bind(this));
		this.on('channelLocked', this.channelLocked.bind(this));
		this.on('channelCapUpdate', this.channelCapUpdate.bind(this));
	}

	// #region Afk check
	private async raidStart(
		raid: Omit<Raid, 'voiceChannelId' | 'messageId' | 'controlPanelId' | 'controlPanelMessageId'>
	): Promise<void> {
		const { guildId, channelId, leaderName, leaderTag } = raid;

		const vetChannelId = await getGuildSetting(guildId, SettingsKey.VetAfkCheck);

		const guild = await this.client.guilds.fetch(guildId).catch(() => undefined);
		if (!guild) return;

		const vet = channelId === vetChannelId;

		const key = vet ? `vet_raid:${guildId}` : `raid:${guildId}`;
		const voiceChannel = await createChannel(guild, `Raiding ${await this.redis.incr(key)}`, vet, 'GUILD_VOICE');

		const channel = guild.channels.cache.get(channelId) as TextChannel;

		const { images, color, name, full_name } = raid.dungeon;

		const embed = new Embed()
			.setDescription(
				stripIndents`
				To participate, join the voice channel and then react to ${raid.dungeon.portal}
				If you have a key and are willing to pop, react to ${raid.dungeon.keys.map((k) => k.emote).join('')}

				To indicate class or gear choices, react below
			`
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
			embeds: [embed],
		});
		await react(m, raid.reacts);

		const channel_ = await createChannel(guild, leaderTag.replace('#', '-'), vet, 'GUILD_TEXT');
		await channel_.setTopic('raid');

		const embed_ = new Embed()
			.setTitle(`${inlineCode(leaderTag)} Control Panel`)
			.setDescription(
				stripIndents`
			${inlineCode('Edit location')} 📝 
			${inlineCode('Reveal location')} 🗺️
			${inlineCode('Abort afk')} 🛑
			${inlineCode('End afk')} ❌
			`
			)
			.addField({ name: 'Location', value: 'Not set' });

		const m_ = await channel_.send({
			embeds: [embed_],
		});
		await m_.react('📝');
		await m_.react('🗺️');
		await m_.react('🛑');
		await m_.react('❌');

		await this.raids.set(`raid:${guildId}:${m.id}`, {
			...raid,
			messageId: m.id,
			controlPanelId: channel_.id,
			controlPanelMessageId: m_.id,
			voiceChannelId: voiceChannel.id,
		});
	}

	private async raidEnd(raid: Raid) {
		const { channelId, voiceChannelId, messageId, dungeon, leaderName } = raid;

		const textChannel = this.client.channels.cache.get(channelId) as TextChannel;
		const msg = await textChannel.messages.fetch(messageId).catch(() => undefined);

		if (msg) {
			const voiceChannel = this.client.channels.cache.get(voiceChannelId) as VoiceChannel;
			// @ts-ignore
			const embed = new Embed(msg.embeds[0])
				.setTitle('')
				.setThumbnail('')
				.setTimestamp()
				.setDescription(`${inlineCode(dungeon.full_name)} raid started in ${voiceChannel.name}`)
				.setFooter({ text: `The afk check was ended by ${leaderName as string}` });
			await msg.edit({
				content: ' ',
				embeds: [embed],
			});
			await msg.reactions.removeAll();
		}
	}
	// #endregion

	// #region Channels
	private async channelStart(channel: Omit<Channel, 'messageId'>) {
		const { name, channelId, leaderId } = channel;

		const channel_ = this.client.channels.cache.get(channelId) as TextChannel;

		const m = await channel_.send({
			content: stripIndents`
        @here ${inlineCode(name)} is now starting.`,
			allowedMentions: {
				parse: ['everyone'],
			},
			embeds: [
				new Embed()
					.setColor(0xfee75c)
					.setTitle(inlineCode(name))
					.setDescription('Please wait for the channel to unlock.'),
			],
		});

		await this.channels.set(`channel:${leaderId}`, {
			...channel,
			messageId: m.id,
		});
	}

	private async channelClose(channel: Channel) {
		const { guildId, leaderId, channelId, voiceChannelId, messageId, name } = channel;
		await this.channels.delete(`channel:${leaderId}`);

		const guild = this.client.guilds.cache.get(guildId);

		const voiceChannel = guild?.channels.cache.get(voiceChannelId);
		if (voiceChannel) {
			await voiceChannel.delete();
		}

		const textChannel = guild?.channels.cache.get(channelId) as TextChannel;
		const message = textChannel.messages.cache.get(messageId);

		await message?.edit({
			content: ' ',
			embeds: [
				new Embed()
					.setColor(0x992d22)
					.setTitle(inlineCode(name))
					.setDescription(`Channel closed ${time(new Date(), 'R')}`),
			],
		});
	}

	private async channelOpen(channel: Channel) {
		const { name, channelId, voiceChannelId, messageId, roleId } = channel;

		const voiceChannel = this.client.channels.cache.get(voiceChannelId) as VoiceChannel;

		await voiceChannel.permissionOverwrites.edit(roleId, {
			CONNECT: true,
		});

		const textChannel = this.client.channels.cache.get(channelId) as TextChannel;

		const m = await textChannel.send({
			content: `@here ${inlineCode(name)} has opened (re-ping)`,
			allowedMentions: {
				parse: ['everyone'],
			},
		});

		await m.delete().catch(() => undefined);

		const msg = textChannel.messages.cache.get(messageId);
		await msg?.edit({
			content: ' ',
			embeds: [
				new Embed()
					.setColor(0x57f287)
					.setTitle(inlineCode(name))
					.setDescription(`Channel opened ${time(new Date(), 'R')}`),
			],
		});
	}

	private async channelLocked(channel: Channel) {
		const { name, channelId, voiceChannelId, messageId, roleId } = channel;

		const voiceChannel = this.client.channels.cache.get(voiceChannelId) as VoiceChannel;

		const textChannel = this.client.channels.cache.get(channelId) as TextChannel;

		await voiceChannel.permissionOverwrites.edit(roleId, {
			CONNECT: false,
		});

		const msg = textChannel.messages.cache.get(messageId);

		await msg?.edit({
			content: ' ',
			embeds: [
				new Embed()
					.setColor(0xed4245)
					.setTitle(inlineCode(name))
					.setDescription(`Channel locked ${time(new Date(), 'R')}`),
			],
		});
	}

	private async channelCapUpdate(channel: Channel, cap: number) {
		const { voiceChannelId } = channel;

		const voiceChannel = this.client.channels.cache.get(voiceChannelId) as VoiceChannel;

		await voiceChannel.setUserLimit(cap);
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
	leaderName?: string;
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

export interface RaidEvents {
	raidStart: [raid: Omit<Raid, 'voiceChannelId' | 'messageId' | 'controlPanelId' | 'controlPanelMessageId'>];
	raidEnd: [raid: Raid];

	channelStart: [channel: Omit<Channel, 'messageId' | 'location'>];
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
