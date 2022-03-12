import type { Client, Guild, GuildMember, Message, TextChannel, ThreadChannel, VoiceChannel } from 'discord.js';
import type { IHeadcount } from './Headcount';
import type { Dungeon, RaidManager } from './RaidManager';

import { container } from 'tsyringe';
import { kClient, kRaids } from '../tokens';

import { Embed, ActionRow, ButtonComponent, ButtonStyle } from 'discord.js';
import { inlineCode } from '@discordjs/builders';

import { random } from '../util/util';
import { nanoid } from 'nanoid';
import { sentenceCase } from 'sentence-case';

import { getGuildSetting, Settings } from '../functions/settings/settings';
import { inVeteranSection } from '../util/inVeteranSection';
const participateButton = new ButtonComponent()
	.setStyle(ButtonStyle.Primary)
	.setCustomId('participate')
	.setEmoji({
		name: '🤚',
	})
	.setLabel('I want to join');

const emojiRegex = new RegExp(/^(?:<(?<animated>a)?:(?<name>\w{2,32}):)?(?<id>\d{17,21})>?$/);

export class Afkcheck implements IAfkcheck {
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

	public constructor(data: Omit<IAfkcheck, 'messageId'>) {
		this.guild = this.client.guilds.cache.get(data.guildId)!;

		this.dungeon = data.dungeon;

		this.guildId = data.guildId;
		this.memberId = data.memberId;
		this.textChannelId = data.textChannelId;
		this.voiceChannelId = data.voiceChannelId;
	}

	public async start() {
		let key: keyof Settings = 'main_section';
		if (await inVeteranSection(this.guildId, this.textChannelId)) {
			key = 'veteran_section';
		}

		const settings = await getGuildSetting(this.guildId, key);
		this.controlPanelChannelId = settings.control_panel_channel_id;

		this.member = this.guild.members.cache.get(this.memberId)!;
		this.textChannel = (await this.guild.channels.fetch(this.textChannelId)) as TextChannel;
		this.voiceChannel = (await this.guild.channels.fetch(this.voiceChannelId)) as VoiceChannel;

		const embed = new Embed()
			.setColor(this.dungeon.color)
			.setThumbnail(random(this.dungeon.images))
			.setAuthor({
				name: `Afk check started by ${this.member.displayName}`,
				iconURL: this.member.displayAvatarURL({ forceStatic: false }),
			})
			.setDescription(
				'If you want to participate in this raid, click the first button (I want to join)\nIf you have any key(s) and are willing to pop, react to the corresponding button(s)\nOtherwise, react to class/item choices that you are bringing'
			);

		const row = new ActionRow().addComponents(participateButton);

		for (const key of this.dungeon.keys) {
			const button = new ButtonComponent().setCustomId(nanoid()).setStyle(ButtonStyle.Secondary);
			const res = emojiRegex.exec(key.emoji);
			if (res !== null) {
				const name = res[2];
				button
					.setEmoji({
						name,
						id: res[3],
					})
					.setLabel(sentenceCase(name));
			} else if (this.client.emojis.cache.has(key.emoji)) {
				const emoji = this.client.emojis.cache.get(key.emoji);
				button
					.setEmoji({
						id: emoji?.id,
						name: emoji!.name!,
					})
					.setLabel(sentenceCase(emoji!.name!));
			}
			row.addComponents(button);
		}

		const m = await this.textChannel.send({
			content: `@here ${inlineCode(this.dungeon.name)} ${this.dungeon.portal} is now starting in ${
				this.voiceChannel.name
			}`,
			allowedMentions: {
				parse: ['everyone'],
			},
			embeds: [embed],
			components: [row],
		});
		this.message = m;
		this.messageId = m.id;

		this.manager.afkchecks.set(`${this.guildId}-${this.textChannelId}-${this.memberId}`, this);

		await this.createControlPanelThread();
	}

	private async createControlPanelThread() {
		const controlPanel = await this.guild.channels.fetch(this.controlPanelChannelId).catch(() => undefined);
		if (controlPanel?.isText()) {
			this.controlPanelThreadChannel = await controlPanel.threads.create({
				name: `${this.member.displayName}'s ${this.dungeon.name} Raid`,
				invitable: false,
			});

			await this.controlPanelThreadChannel.send({ content: 'This is your control panel.' });
		}
	}
}

export interface IAfkcheck extends IHeadcount {}
