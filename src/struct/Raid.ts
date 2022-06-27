import { hyperlink, inlineCode } from '@discordjs/builders';
import { stripIndents } from 'common-tags';
import {
	ChannelType,
	Client,
	Collection,
	EmbedBuilder,
	Guild,
	GuildMember,
	Message,
	TextChannel,
	ThreadChannel,
	VoiceChannel,
} from 'discord.js';
import { container } from 'tsyringe';
import type { Dungeon, RaidManager } from './RaidManager';
import { kClient, kRaids } from '../tokens';

import { config, type GuildConfig } from '../util/config';
import { react } from '#functions/react';
import {
	ABORT_ID,
	afkCheckButtons,
	CHANGE_LOCATION_ID,
	END_ID,
	FINISH_ID,
	headCountButtons,
	participateButton,
	REVEAL_LOCATION_ID,
	generateActionRows,
	generateButtonsFromEmojis,
} from '#util/util';

export enum RaidType {
	Headcount = 0,
	AfkCheck = 1,
}

const mappedButtonEmojis = {
	'📝': '📝 Change location',
	'🗺️': '🗺️ Reveal location',
	'🛑': '🛑 Abort',
	'❌': '❌ End',
	'✅': '✅ Finish (mark this raid as done)',
};

const listButtonsFromType = (type: RaidType) => {
	if (type === RaidType.AfkCheck) {
		return afkCheckButtons.map((button) => Reflect.get(mappedButtonEmojis, button.data.emoji!.name!) as string);
	}

	return headCountButtons.map((button) => Reflect.get(mappedButtonEmojis, button.data.emoji!.name!) as string);
};

export function isVeteranSection(config: GuildConfig, id: string): boolean {
	const { veteran_raiding } = config;

	if (veteran_raiding.status_channel_id === id) return true;
	if (veteran_raiding.control_panel_channel_id === id) return true;
	if (veteran_raiding.category_id === id) return true;
	if (veteran_raiding.voice_channel_ids.includes(id)) return true;
	if (veteran_raiding.verification_channel_id === id) return true;

	return false;
}

export const RAID_MESSAGE = (dungeonName: string, dungeonEmoji: string, voiceChannel: string, isAfkCheck: boolean) =>
	`@here \`${dungeonName}\` ${dungeonEmoji} ${isAfkCheck ? 'is now starting in' : 'Headcount for'} ${voiceChannel}`;

export class Raid implements RaidBase {
	private readonly client = container.resolve<Client<true>>(kClient);
	private readonly manager = container.resolve<RaidManager>(kRaids);

	private readonly guild!: Guild;
	private readonly member!: GuildMember;
	private readonly mainMessage!: Message;
	private readonly textChannel!: TextChannel;
	private readonly voiceChannel!: VoiceChannel;
	private readonly controlPanel!: TextChannel;
	private readonly controlPanelThread!: ThreadChannel;

	public reactions: Collection<string, ReactionStateUsers>;

	public textChannelId: string;
	public voiceChannelId: string;
	public controlPanelId!: string;
	public controlPanelThreadId!: string;

	public mainMessageId!: string;
	public controlPanelThreadMessageId!: string;

	public guildId: string;
	public memberId: string;
	public dungeon: Dungeon;
	public type: RaidType;
	public location: string;
	public locationRevealed: boolean;

	public constructor(raid: Omit<RaidBase, 'mainMessageId'> & { type: RaidType }) {
		const { guildId, dungeon, memberId, textChannelId, voiceChannelId } = raid;

		Reflect.defineProperty(this, 'guild', { value: this.client.guilds.cache.get(guildId) });

		this.dungeon = dungeon;
		this.guildId = guildId;
		this.memberId = memberId;
		this.textChannelId = textChannelId;
		this.voiceChannelId = voiceChannelId;
		this.location = '';
		this.locationRevealed = false;
		this.type = raid.type;

		this.reactions = new Collection();
	}

	public async init() {
		const isVet = isVeteranSection(config, this.textChannelId);
		const controlPanelChannelId = config[isVet ? 'veteran_raiding' : 'main_raiding'].control_panel_channel_id;

		this.controlPanelId = controlPanelChannelId;

		Reflect.defineProperty(this, 'member', { value: this.guild.members.cache.get(this.memberId) });

		const textChannel = await this.guild.channels.fetch(this.textChannelId);
		if (textChannel?.isTextBased()) Reflect.defineProperty(this, 'textChannel', { value: textChannel });

		const voiceChannel = await this.guild.channels.fetch(this.voiceChannelId);
		if (voiceChannel?.isVoiceBased()) Reflect.defineProperty(this, 'voiceChannel', { value: voiceChannel });

		const controlPanel = await this.guild.channels.fetch(this.controlPanelId);
		if (controlPanel?.isTextBased() && controlPanel.type === ChannelType.GuildText) {
			Reflect.defineProperty(this, 'controlPanel', { value: controlPanel });

			await controlPanel.threads
				.create({
					name: `${this.member.displayName}'s ${this.dungeon.name} ${this.typeName}`,
				})
				.then(async (channel) => {
					this.controlPanelThreadId = channel.id;
					Reflect.defineProperty(this, 'controlPanelThread', { value: channel });

					await this.notify();
					await this.setupControlPanel();
					this.save();
				});
		}
	}

	public async notify() {
		const { dungeon } = this;
		const embed = new EmbedBuilder()
			.setColor(dungeon.color)
			.setThumbnail(dungeon.images[Math.floor(Math.random() * dungeon.images.length)])
			.setAuthor({
				name: `${dungeon.name} started by ${this.member.displayName}`,
				iconURL: this.member.displayAvatarURL(),
			})
			.setDescription(
				`If you want to participate in this raid, click 🤚
				
				If you have a key (${dungeon.keys
					.map((key) => this.client.emojis.cache.get(key.emoji)?.toString() ?? '')
					.join('')}) and are willing to pop, click to the corresponding button
				
				Otherwise, react to the class/item choices that you are bringing`
			)
			.setTimestamp();

		const components = generateActionRows(participateButton, ...generateButtonsFromEmojis(this.dungeon.keys));

		await this.textChannel
			.send({
				content: RAID_MESSAGE(
					dungeon.name,
					this.client.emojis.cache.get(dungeon.portal)?.toString() ?? '',
					this.voiceChannel.name,
					this.isAfkcheck
				),
				allowedMentions: { parse: ['everyone'] },
				embeds: [embed.toJSON()],
				components: components,
			})
			.then(async (m) => {
				if (this.isAfkcheck) {
					await react(
						m,
						dungeon.main.map((emoji) => emoji.emoji)
					);
				}

				Reflect.defineProperty(this, 'mainMessage', { value: m });
				this.mainMessageId = m.id;
			});
	}

	public async end() {
		const embed = new EmbedBuilder()
			.setAuthor({
				name: this.member.displayName,
				iconURL: this.member.displayAvatarURL(),
			})
			.setDescription(`This ${this.dungeon.name} ${this.typeName} was ended by the raid leader.`)
			.setColor('Yellow');

		try {
			await this.mainMessage.edit({
				content: ' ',
				components: [],
				embeds: [embed.toJSON()],
			});
			await this.mainMessage.reactions.removeAll();

			const msg = this.controlPanelThread.messages.cache.get(this.controlPanelThreadMessageId);
			await msg?.edit({ components: [] });
		} catch {}

		this.manager.raids.delete(this.key);
	}

	public async abort() {
		const embed = new EmbedBuilder()
			.setAuthor({
				name: this.member.displayName,
				iconURL: this.member.displayAvatarURL(),
			})
			.setDescription(`This ${this.dungeon.name} ${this.typeName} was aborted by the raid leader.`)
			.setColor('DarkRed');

		await this.mainMessage.edit({
			content: ' ',
			components: [],
			embeds: [embed.toJSON()],
		});

		await this.mainMessage.reactions.removeAll().catch(() => undefined);
		await this.controlPanelThread.setArchived(true);
		await this.manager.raids.delete(this.key);
	}

	private async setupControlPanel() {
		const embed = new EmbedBuilder()
			.setAuthor({ name: this.member.displayName, iconURL: this.member.displayAvatarURL() })
			.setDescription(
				stripIndents`
			
				This is your control panel to manage your raid found ${hyperlink('here', this.mainMessage.url)}
				
				For any available action, click the corresponding button below
				
				${listButtonsFromType(this.type).join('\n')}
		`
			)
			.setTimestamp()
			.setColor(this.dungeon.color);

		const buttons = this.isAfkcheck ? afkCheckButtons : headCountButtons;
		const m = await this.controlPanelThread
			.send({
				embeds: [embed.toJSON()],
				components: generateActionRows(...buttons),
			})
			.then((msg) => {
				Reflect.defineProperty(this, 'controlPanelThreadMessage', { value: msg });
				this.controlPanelThreadMessageId = msg.id;

				return msg;
			});

		const collector = m.createMessageComponentCollector();
		collector.on('collect', async (interaction) => {
			if (
				!interaction.isButton() ||
				interaction.channelId !== this.controlPanelThread.id ||
				interaction.message.id !== this.controlPanelThreadMessageId
			)
				return;

			if (interaction.user.id !== this.memberId) {
				await interaction.reply({ content: "This wasn't meant for you.", ephemeral: true });
				return;
			}

			await interaction.deferReply();

			switch (interaction.customId) {
				case ABORT_ID:
					await this.abort();
					await interaction.editReply('Headcount aborted.');
					break;
				case END_ID:
					await this.end();
					await interaction.editReply('Headcount ended.');
					break;
				case CHANGE_LOCATION_ID:
					await interaction.editReply('Enter a new location for this raid.');

					const msg = await m.channel
						.awaitMessages({
							filter: (m) => m.author.id === this.memberId,
						})
						.then((coll) => coll.first())
						.catch(async () => {
							await interaction.editReply('You failed to enter a new location.');
							return undefined;
						});

					if (msg?.content && this.isAfkcheck) {
						this.location = msg.content;

						await interaction.editReply('✅Updated location.');

						// update control panel embed
						const msg_ = this.controlPanelThread.messages.cache.get(this.controlPanelThreadMessageId)!;
						const embed = msg_.embeds[0];
						const embed_ = new EmbedBuilder(embed.data).setFields({ name: 'Location', value: this.location });

						await msg_.edit({ embeds: [embed_.toJSON()] });
						await msg.delete().catch(() => undefined);
					}
					break;
				case REVEAL_LOCATION_ID:
					if (this.isAfkcheck) {
						if (!this.location) {
							await interaction.editReply('Set a location before revealing.');
							return;
						}

						if (this.locationRevealed) {
							await interaction.editReply('Location has already been revealed.');
							return;
						}

						const embed = this.mainMessage.embeds[0];
						const embed_ = new EmbedBuilder(embed.data).setDescription(
							`${embed.description!}\n\n🗺️ The location for this raid is: ${inlineCode(this.location)}`
						);
						await this.mainMessage.edit({ embeds: [embed_.toJSON()] });

						this.locationRevealed = true;
						await interaction.editReply('Revealed location.');
					}
					break;
				case FINISH_ID:
					if (this.isAfkcheck) {
						this.delete();
						await interaction.editReply('Done.');
					}

					break;
			}
		});
	}

	public save() {
		this.manager.raids.set(this.key, this);
	}

	public delete() {
		this.manager.raids.delete(this.key);
	}

	public getReaction(emojiId: string, state: ReactionState) {
		return this.reactions.get(emojiId)![state];
	}

	public addReaction(emojiId: string, userId: string, state: ReactionState) {
		this.getReaction(emojiId, state).add(userId);
	}

	public removeReaction(emojiId: string, userId: string, state: ReactionState) {
		this.getReaction(emojiId, state).delete(userId);
	}

	public userReacted(emojiId: string, userId: string, state: ReactionState) {
		return this.getReaction(emojiId, state).has(userId);
	}

	public get typeName() {
		const formattedName = this.isAfkcheck ? 'Afkcheck' : 'Headcount';
		return formattedName;
	}

	public get isAfkcheck() {
		return this.type === RaidType.AfkCheck;
	}

	private get key(): string {
		return `${this.guildId}-${this.memberId}`;
	}
}

export interface RaidBase {
	guildId: string;
	memberId: string;
	mainMessageId: string;
	textChannelId: string;
	voiceChannelId: string;
	dungeon: Dungeon;
}

type ReactionState = 'pending' | 'confirmed';
interface ReactionStateUsers {
	confirmed: Set<string>;
	pending: Set<string>;
}
