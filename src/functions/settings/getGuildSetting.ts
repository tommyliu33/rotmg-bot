import type { PrismaClient } from '.prisma/client';
import type { Snowflake } from 'discord.js';
import { container } from 'tsyringe';
import { kPrisma } from '../../tokens';

export enum SettingsKey {
	AfkCheck = 'afk_check_channel_id',
	VetAfkCheck = 'vet_afk_check_channel_id',

	MainSection = 'main_section_id',
	VetSection = 'veteran_section_id',

	MainUserRole = 'verified_role_id',
	VetUserRole = 'veteran_role_id',

	RaidLeaderRole = 'raid_leader_role_id',
	VetRaidLeaderRole = 'vet_raid_leader_role_id',

	SuspendRole = 'suspend_role_id',
	LogChannel = 'log_channel_id',

	MainSectionVoiceChannels = 'main_section_voice_channel_ids',
	VetSectionVoiceChannels = 'veteran_section_voice_channel_ids',

	PrivateLocation = 'private_location',
	Rank = 'rank',

	MainVerificationButton = 'main_verification_button_id',
	VeteranVerificationButton = 'veteran_verification_button_id',

	OryxSanctuary = 'o3',
	TheVoid = 'void',
	TheShatters = 'shatters',
	CultistHideout = 'cult',
	TheNest = 'nest',
	FungalCavern = 'fungal',
}

export async function getGuildSetting(guildId: Snowflake, key: SettingsKey): Promise<any> {
	const prisma = container.resolve<PrismaClient>(kPrisma);

	let data = await prisma.guilds
		.findFirst({
			where: {
				id_: guildId,
			},
		})
		.catch(() => {
			return undefined;
		});

	if (!data) {
		data = await prisma.guilds.create({
			data: {
				id_: guildId,

				afk_check_channel_id: '',
				vet_afk_check_channel_id: '',

				main_section_id: '',
				veteran_section_id: '',

				verified_role_id: '',
				veteran_role_id: '',

				raid_leader_role_id: '',
				vet_raid_leader_role_id: '',

				log_channel_id: '',
				suspend_role_id: '',

				main_section_voice_channel_ids: [],
				veteran_section_voice_channel_ids: [],

				private_location: true,
				rank: 0,

				main_verification_button_id: '',
				veteran_verification_button_id: '',

				o3: 0,
				void: 0,
				cult: 0,
				fungal: 0,
				shatters: 0,
				nest: 0,

				main_section_requirements: {
					private_location: false,
					rank: 0,
				},

				veteran_section_requirements: {
					o3: 0,
					void: 0,
					shatters: 0,
					cult: 0,
					nest: 0,
					fungal: 0,
				},
			},
		});
	}

	return data[key];
}
