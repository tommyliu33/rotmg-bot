import { hyperlink, inlineCode } from '@discordjs/builders';
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
import templite from 'templite';
import { container } from 'tsyringe';
import type { Dungeon, RaidManager } from './RaidManager';
import { kClient, kRaids } from '../tokens';
import { react } from '#functions/react';
import type { GuildDocument } from '#util/mongo';
import {
	ABORT_ID,
	afkCheckButtons,
	CHANGE_LOCATION_ID,
	END_ID,
	FINISH_ID,
	generateActionRows,
	generateButtonsFromEmojis,
	headCountButtons,
	participateButton,
	REVEAL_LOCATION_ID,
} from '#util/util';

const mappedButtonEmojis = {
	'📝': 'Change location',
	'🗺️': 'Reveal location',
	'🛑': 'Abort',
	'❌': 'End',
	'✅': 'Finish',
};

const listButtonsFromType = (type: RaidType) => {
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	const buttons = type === RaidType.AfkCheck ? afkCheckButtons : headCountButtons;
	return buttons.map(
		(button) => `${button.data.emoji!.name!} ${Reflect.get(mappedButtonEmojis, button.data.emoji!.name!) as string}`
	);
};

export enum RaidType {
	Headcount = 0,
	AfkCheck = 1,
}

export function isVeteranSection(doc: GuildDocument, id: string): boolean {
	const { veteran_raiding } = doc;

	if (veteran_raiding.status_channel_id === id) return true;
	if (veteran_raiding.control_panel_channel_id === id) return true;
	if (veteran_raiding.category_id === id) return true;
	if (veteran_raiding.voice_channel_ids.includes(id)) return true;
	if (veteran_raiding.verification_channel_id === id) return true;

	return false;
}

export class Raid implements RaidBase {
	private readonly client = container.resolve<Client<true>>(kClient);
	private readonly manager = container.resolve<RaidManager>(kRaids);

	public guild: Guild;
	public member!: GuildMember;
	public mainMessage!: Message;
	public textChannel!: TextChannel;
	public voiceChannel!: VoiceChannel;
	public controlPanel!: TextChannel;
	public controlPanelThread!: ThreadChannel;

	public reactions: Collection<string, ReactionStateUsers> = new Collection();

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
	public location = '';
	public locationRevealed = false;

	private readonly doc!: GuildDocument;

	public constructor(raid: Omit<RaidBase, 'mainMessageId'> & { type: RaidType; doc: GuildDocument }) {
		const { guildId, dungeon, memberId, textChannelId, voiceChannelId } = raid;

		this.guild = this.client.guilds.cache.get(guildId)!;
		this.doc = raid.doc;

		this.dungeon = dungeon;
		this.guildId = guildId;
		this.memberId = memberId;
		this.textChannelId = textChannelId;
		this.voiceChannelId = voiceChannelId;

		this.type = raid.type;
	}

	public async init() {
		const isVet = isVeteranSection(this.doc, this.textChannelId);
		const controlPanelChannelId = this.doc[isVet ? 'veteran_raiding' : 'main_raiding'].control_panel_channel_id;

		this.controlPanelId = controlPanelChannelId;

		this.member = this.guild.members.cache.get(this.memberId)!;

		const textChannel = await this.guild.channels.fetch(this.textChannelId);
		if (textChannel?.type === ChannelType.GuildText) this.textChannel = textChannel;

		await this.notify();

		const voiceChannel = await this.guild.channels.fetch(this.voiceChannelId);
		if (voiceChannel?.type === ChannelType.GuildVoice) this.voiceChannel = voiceChannel;

		const controlPanel = await this.guild.channels.fetch(this.controlPanelId);
		if (controlPanel?.isTextBased() && controlPanel.type === ChannelType.GuildText) {
			this.controlPanel = controlPanel;
			await this.setupControlPanel();
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
			// .setDescription(
			// 	`If you want to participate in this raid, click 🤚

			// 	If you have a key (${dungeon.keys
			// 		.map((key) => this.client.emojis.cache.get(key.emoji)?.toString() ?? '')
			// 		.join('')}) and are willing to pop, click to the corresponding button

			// 	Otherwise, react to the class/item choices that you are bringing`
			// )
			.setDescription(
				templite(
					`A {{dungeon_name}} {{dungeon_type}} has been started by {{raid_leader}}.
		React with {{primary_emoji}} if you plan to join.
		React with {{secondary_emoji}} if you have a key.
		Otherwise react with your role, gear, and class choices below.`,
					{
						dungeon_name: dungeon.name,
						dungeon_type: this.typeName,
						raid_leader: this.member.toString(),
						primary_emoji: this.client.emojis.cache.get(this.dungeon.portal)?.toString() ?? '',
						secondary_emoji: this.dungeon.keys.map(
							(emoji) => this.client.emojis.cache.get(emoji.emoji)?.toString() ?? ''
						),
					}
				)
			)
			.setTimestamp();

		const components = generateActionRows([participateButton, ...generateButtonsFromEmojis(this.dungeon.keys)]);
		await this.textChannel
			.send({
				content: '@here',
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
		const thread = await this.controlPanel.threads.create({
			// TODO: get a single name from a double acc
			name: `${this.member.displayName}'s ${this.dungeon.name} ${this.typeName}`,
		});

		this.controlPanelThreadId = thread.id;
		this.controlPanelThread = thread;

		const embed = new EmbedBuilder()
			.setAuthor({ name: this.member.displayName, iconURL: this.member.displayAvatarURL() })
			.setDescription(
				`This is your control panel to manage your raid found ${hyperlink('here', this.mainMessage.url)}
		
		For any available action, click the corresponding button below
		
		${listButtonsFromType(this.type).join('\n')}`
			)
			.setTimestamp()
			.setColor(this.dungeon.color);

		const buttons = this.isAfkcheck ? afkCheckButtons : headCountButtons;
		const m = await this.controlPanelThread
			.send({
				embeds: [embed.toJSON()],
				components: generateActionRows(buttons),
			})
			.then((msg) => {
				Reflect.defineProperty(this, 'controlPanelThreadMessage', { value: msg });
				this.controlPanelThreadMessageId = msg.id;

				return msg;
			});

		this.save();

		// void controlPanel.threads
		// 	.create({
		// 		name: `${this.member.displayName}'s ${this.dungeon.name} ${this.typeName}`,
		// 	})
		// 	.then(async (channel) => {
		// 		this.controlPanelThreadId = channel.id;
		// 		Reflect.defineProperty(this, 'controlPanelThread', { value: channel });

		// 		await this.notify();
		// 		await this.setupControlPanel();
		// 		this.save();
		// 	});

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
