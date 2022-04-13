import { hyperlink, inlineCode } from '@discordjs/builders';
import { stripIndents } from 'common-tags';
import {
	Client,
	EmbedBuilder,
	Guild,
	GuildMember,
	Message,
	TextChannel,
	ThreadChannel,
	VoiceChannel,
} from 'discord.js';
import { container } from 'tsyringe';
import { Afkcheck } from './Afkcheck';
import type { Database } from './Database';
import type { Headcount } from './Headcount';
import type { Dungeon, RaidManager } from './RaidManager';
import { kClient, kDatabase, kRaids } from '../../tokens';
import {
	ABORT_ID,
	afkCheckButtons,
	CHANGE_LOCATION_ID,
	END_ID,
	FINISH_ID,
	headCountButtons,
	participateButton,
	REVEAL_LOCATION_ID,
} from '#constants/buttons';
import { collectMessage } from '#functions/collectMessage';
import { react } from '#functions/react';
import { RAID_MESSAGE } from '#util/messages';
import { generateActionRows, generateButtonsFromEmojis, isVeteranSection, random } from '#util/util';

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

export class Raid implements RaidBase {
	private readonly client = container.resolve<Client<true>>(kClient);
	private readonly manager = container.resolve<RaidManager>(kRaids);
	private readonly db = container.resolve<Database>(kDatabase);

	private readonly guild!: Guild;
	private readonly member!: GuildMember;
	private readonly mainMessage!: Message;
	private readonly textChannel!: TextChannel;
	private readonly voiceChannel!: VoiceChannel;
	private readonly controlPanel!: TextChannel;
	private readonly controlPanelThread!: ThreadChannel;

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

	public constructor(raid: Omit<RaidBase, 'mainMessageId'>) {
		const { guildId, dungeon, memberId, textChannelId, voiceChannelId } = raid;

		Object.defineProperty(this, 'guild', { value: this.client.guilds.cache.get(guildId) });

		this.dungeon = dungeon;
		this.guildId = guildId;
		this.memberId = memberId;
		this.textChannelId = textChannelId;
		this.voiceChannelId = voiceChannelId;

		this.type = this instanceof Afkcheck ? RaidType.AfkCheck : RaidType.Headcount;
	}

	public async begin() {
		const key = (await isVeteranSection(this.guildId, this.textChannelId)) ? 'veteran' : 'main';
		const { controlPanelChannelId } = await this.db.getSection(this.guildId, key);

		this.controlPanelId = controlPanelChannelId;

		const member = await this.guild.members.fetch(this.memberId);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (member) Object.defineProperty(this, 'member', { value: member });

		const textChannel = await this.guild.channels.fetch(this.textChannelId);
		if (textChannel?.isText()) Object.defineProperty(this, 'textChannel', { value: textChannel });

		const voiceChannel = await this.guild.channels.fetch(this.voiceChannelId);
		if (voiceChannel?.isVoice()) Object.defineProperty(this, 'voiceChannel', { value: voiceChannel });

		const controlPanel = await this.guild.channels.fetch(this.controlPanelId);
		if (controlPanel?.isText()) {
			Object.defineProperty(this, 'controlPanel', { value: controlPanel });

			await controlPanel.threads
				.create({
					name: `${this.member.displayName}'s ${this.dungeon.name} ${this.typeName}`,
				})
				.then(async (channel) => {
					this.controlPanelThreadId = channel.id;
					Object.defineProperty(this, 'controlPanelThread', { value: channel });

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
			.setThumbnail(random(dungeon.images))
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
					this.isAfkCheck()
				),
				allowedMentions: { parse: ['everyone'] },
				embeds: [embed.toJSON()],
				components: components,
			})
			.then(async (m) => {
				await react(
					m,
					dungeon.main.map((emoji) => emoji.emoji)
				);

				Object.defineProperty(this, 'mainMessage', { value: m });
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

		this.manager.headcounts.delete(`${this.guildId}-${this.memberId}`);
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

		const buttons = this.isAfkCheck() ? afkCheckButtons : headCountButtons;
		const m = await this.controlPanelThread
			.send({
				embeds: [embed.toJSON()],
				components: generateActionRows(...buttons),
			})
			.then((msg) => {
				Object.defineProperty(this, 'controlPanelThreadMessage', { value: msg });
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
					await interaction.editReply('✅ Aborted your headcount.');
					break;
				case END_ID:
					await this.end();
					await interaction.editReply('✅ Ended your headcount.');
					break;
				case CHANGE_LOCATION_ID:
					await interaction.editReply('Enter a new location for this raid.');

					const msg = await collectMessage({
						filter: (m) => m.author.id === this.memberId,
						channel: this.controlPanelThread,
					}).catch(async () => {
						await interaction.editReply('You failed to enter a new location.');
						return undefined;
					});

					if (msg?.content && this.isAfkCheck()) {
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
					if (this.isAfkCheck()) {
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
					if (this.isAfkCheck()) {
						this.delete();
						await interaction.editReply('Done.');
					}

					break;
			}
		});
	}

	// cache the raid
	public save() {
		if (this.isAfkCheck()) {
			this.manager.afkchecks.set(this.key, this);
			return;
		}

		this.manager.headcounts.set(this.key, this);
	}

	// delete raid from cache
	public delete() {
		if (this.isAfkCheck()) {
			this.manager.afkchecks.delete(this.key);
			return;
		}

		this.manager.headcounts.delete(this.key);
	}

	public isAfkCheck(): this is Afkcheck {
		return this.type === RaidType.AfkCheck;
	}

	public isHeadCount(): this is Headcount {
		return this.type === RaidType.Headcount;
	}

	public get typeName() {
		const formattedName = this.isAfkCheck() ? 'Afkcheck' : 'Headcount';
		return formattedName;
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
