import type {
	Client,
	Interaction,
	Guild,
	GuildMember,
	Message,
	TextChannel,
	ThreadChannel,
	VoiceChannel,
} from 'discord.js';
import type { IHeadcount } from './Headcount';
import type { Dungeon, RaidManager } from './RaidManager';

import { container } from 'tsyringe';
import { kClient, kRaids } from '../tokens';

import {
	InteractionCollector,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	Collection,
	ButtonStyle,
	ComponentType,
} from 'discord.js';
import { inlineCode } from '@discordjs/builders';
import { nanoid } from 'nanoid';

import { collectMessage } from '../functions/collectMessage';
import { getGuildSetting, Settings } from '../functions/settings/getGuildSetting';
import { inVeteranSection } from '../util/inVeteranSection';

import { setTimeout } from 'node:timers';
import { messageReact } from '../functions/messages/messageReact';

const participateButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('participate').setEmoji({
	name: '🤚',
});

const changeLocationButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('change').setEmoji({
	name: '📝',
});

const revealLocationButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('reveal').setEmoji({
	name: '🗺️',
});

const abortAfkButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('abort').setEmoji({
	name: '🛑',
});

const endAfkButton = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('end').setEmoji({
	name: '❌',
});

function timedDelete(interaction: Interaction, deleteAfter: number) {
	if (!interaction.isRepliable()) return;
	setTimeout(() => void interaction.deleteReply(), deleteAfter).unref();
}

// TODO: refactor

export class Afkcheck implements IAfkcheck {
	public client = container.resolve<Client<true>>(kClient);
	public manager = container.resolve<RaidManager>(kRaids);

	public declare guild: Guild;
	public declare member: GuildMember;
	public declare textChannel: TextChannel;
	public declare controlPanelChannel: TextChannel;
	public declare voiceChannel: VoiceChannel;
	public declare controlPanelThreadChannel: ThreadChannel;
	public declare message: Message;
	public declare controlPanelThreadMessage: Message;

	public guildId: string;
	public memberId: string;
	public textChannelId: string;
	public controlPanelChannelId!: string;
	public voiceChannelId: string;
	public controlPanelThreadChannelId!: string;
	public messageId!: string;
	public controlPanelThreadMessageId!: string;

	public dungeon: Dungeon;

	public declare location: string;
	public locationRevealed: boolean;

	public reactions: Collection<
		string,
		{
			confirmed: Set<string>;
			pending: Set<string>;
		}
	>;

	public constructor(data: Omit<IAfkcheck, 'messageId'>) {
		this.dungeon = data.dungeon;

		this.guildId = data.guildId;
		this.memberId = data.memberId;
		this.textChannelId = data.textChannelId;
		this.voiceChannelId = data.voiceChannelId;

		this.locationRevealed = false;
		this.reactions = new Collection();
	}

	public async populate() {
		this.guild = this.client.guilds.cache.get(this.guildId)!;
		this.member = this.guild.members.cache.get(this.memberId)!;

		this.textChannel = (await this.guild.channels.fetch(this.textChannelId)) as TextChannel;
		this.voiceChannel = (await this.guild.channels.fetch(this.voiceChannelId)) as VoiceChannel;

		let key: keyof Settings = 'main';
		if (await inVeteranSection(this.guildId, this.textChannelId)) {
			key = 'veteran';
		}

		const settings = await getGuildSetting(this.guildId, key);
		this.controlPanelChannelId = settings.controlPanelChannelId;

		await this.createControlPanelThread();
	}

	public async start() {
		await this.populate();

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

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(participateButton);

		for (const key of dungeon.keys) {
			const button = new ButtonBuilder().setCustomId(nanoid()).setStyle(ButtonStyle.Secondary);
			if (this.client.emojis.cache.has(key.emoji)) {
				const emoji = this.client.emojis.cache.get(key.emoji);
				button.setEmoji({
					id: emoji?.id,
				});
			}
			row.addComponents(button);
		}

		const m = await this.textChannel.send({
			content: `@here ${inlineCode(dungeon.name)} ${
				this.client.emojis.cache.get(dungeon.portal)?.toString() ?? ''
			} is now starting in ${this.voiceChannel.name}`,
			allowedMentions: { parse: ['everyone'] },
			embeds: [embed],
			components: [row],
		});
		await messageReact(
			m,
			dungeon.main.map((emoji) => emoji.emoji)
		);

		this.message = m;
		this.messageId = m.id;

		this.manager.afkchecks.set(`${this.guildId}-${this.memberId}`, this);
	}

	public async end() {
		await this.message.edit({
			content: `This ${inlineCode(this.dungeon.name)} afk check has ended.`,
			embeds: [],
			components: [],
		});

		const messages = await this.controlPanelChannel.messages.fetchPinned().catch(() => undefined);
		const embedMessage = messages?.find((msg) => msg.embeds.length > 0 && msg.author.id === this.client.user.id);
		if (!embedMessage) return;

		await embedMessage.edit({ components: [] });
	}

	public async abort() {
		await this.message.edit({
			content: `This ${inlineCode(this.dungeon.name)} afk check was aborted.`,
			embeds: [],
			components: [],
		});

		await this.controlPanelThreadChannel.delete().catch(async () => {
			await this.controlPanelThreadChannel.setArchived(true);
			return undefined;
		});
	}

	private async createControlPanelThread() {
		const controlPanel = await this.guild.channels.fetch(this.controlPanelChannelId).catch(() => undefined);
		if (controlPanel?.isText()) {
			this.controlPanelThreadChannel = await controlPanel.threads.create({
				name: `${this.member.displayName}'s ${this.dungeon.name} Raid`,
			});

			const embed = new EmbedBuilder()
				.setDescription('📝 - Change Location\n🗺️ - Reveal Location\n🛑 - Abort Afk\n❌ - End Afk')
				.setTimestamp();

			const m = await this.controlPanelThreadChannel.send({
				embeds: [embed.toJSON()],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						changeLocationButton,
						revealLocationButton,
						abortAfkButton,
						endAfkButton
					),
				],
			});
			this.controlPanelThreadMessage = m;
			this.controlPanelThreadMessageId = m.id;

			await m.pin().catch(() => undefined);

			const collector = new InteractionCollector(this.client, {
				channel: this.controlPanelThreadChannel,
				componentType: ComponentType.Button,
			});
			collector.on('collect', async (collectedInteraction) => {
				if (!collectedInteraction.isButton()) return;

				if (collectedInteraction.user.id !== this.memberId) {
					await collectedInteraction.reply({ content: 'This is only available to the raid leader.', ephemeral: true });
					return;
				}

				await collectedInteraction.deferReply();
				if (collectedInteraction.customId === 'change') {
					await collectedInteraction.editReply({
						content: 'Enter the new location for this raid.',
					});

					const message = await collectMessage({
						filter: (m) => m.author.id === this.memberId,
						channel: this.controlPanelThreadChannel,
						time: 60_000,
					}).catch(async () => {
						await collectedInteraction.editReply({ content: 'You failed to enter a new location.' });
						timedDelete(collectedInteraction, 5000);
						return undefined;
					});

					if (message?.content) {
						this.location = message.content;
						await collectedInteraction.editReply({ content: 'Updated location.' });

						const embed = this.controlPanelThreadMessage.embeds[0];
						const embed_ = new EmbedBuilder(embed.data).setFields({ name: 'Location', value: this.location });

						await this.controlPanelThreadMessage.edit({ embeds: [embed_.toJSON()] });

						timedDelete(collectedInteraction, 5000);
						await message.delete().catch(() => undefined);
					}
				} else if (collectedInteraction.customId === 'reveal') {
					if (!this.location) {
						await collectedInteraction.editReply('Set a location before revealing.');
						timedDelete(collectedInteraction, 5000);
						return;
					}

					if (this.locationRevealed) {
						await collectedInteraction.editReply('Location has already been revealed');
						timedDelete(collectedInteraction, 5000);
						return;
					}

					const embed = this.message.embeds[0].data;
					const embed_ = new EmbedBuilder(embed).setDescription(
						`${embed.description!}\n\n🗺️ The location for this raid is: ${inlineCode(this.location)}`
					);
					await this.message.edit({ embeds: [embed_.toJSON()] });

					this.locationRevealed = true;
					await collectedInteraction.editReply('Revealed location.');
					timedDelete(collectedInteraction, 5000);
				} else if (collectedInteraction.customId === 'abort') {
					await this.abort();

					await collectedInteraction.editReply('Aborted afk check.');
					timedDelete(collectedInteraction, 5000);
				} else if (collectedInteraction.customId === 'end') {
					await this.end();

					await collectedInteraction.editReply('Ended afk check.');
					timedDelete(collectedInteraction, 5000);
				}
			});
		}
	}

	public addReaction(emojiId: string, userId: string, state: 'pending' | 'confirmed') {
		this.reactions.get(emojiId)![state].add(userId);
	}

	public removeReaction(emojiId: string, userId: string, state: 'pending' | 'confirmed') {
		this.reactions.get(emojiId)![state].delete(userId);
	}

	public getReaction(emojiId: string, state: 'pending' | 'confirmed') {
		return this.reactions.get(emojiId)![state];
	}
}

export interface IAfkcheck extends IHeadcount {}
