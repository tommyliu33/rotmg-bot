import { container } from 'tsyringe';
import { kPrisma } from '../../tokens';

import type { PrismaClient } from '@prisma/client';

enum SettingsKey {
	GuildId = 'guild_id',

	AfkCheck = 'afk_check_channel_id',
	VetAfkCheck = 'vet_afk_check_channel_id',

	MainSection = 'main_section_id',
	VetSection = 'veteran_section_id',

	VerifiedRole = 'verified_role_id',
	VeteranRole = 'veteran_role_id',

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

interface GuildSettings {
	GuildId: string;

	AfkCheck: string;
	VetAfkCheck: string;

	LogChannel: string;

	VerifiedRole: string;
	RaidLeaderRole: string;
	VeteranRole: string;
	VetRaidLeaderRole: string;
	SuspendRole: string;

	MainSection: string;
	VetSection: string;

	MainSectionVoiceChannels: string[];
	VetSectionVoiceChannels: string[];

	MainSectionRequirements: {
		private_location: boolean;
		rank: number;
	};
	VeteranSectionRequirements: {
		o3: 0;
		void: 0;
		shatters: 0;
		cult: 0;
		nest: 0;
		fungal: 0;
	};

	MainVerificationButton: string;
	VeteranVerificationButton: string;
}

export async function getGuildSetting<Setting extends keyof GuildSettings>(
	guildId: string,
	key: Setting
): Promise<GuildSettings[Setting]> {
	const prisma = container.resolve<PrismaClient>(kPrisma);

	const data =
		(await prisma.guilds
			.findFirst({
				where: {
					guild_id: guildId,
				},
			}) ?? (await setDefaultGuildSettings(prisma, guildId));
	const rawKey = Reflect.get(SettingsKey, key) as Setting;
	return Reflect.get(data, rawKey);
}

async function setDefaultGuildSettings(prisma: PrismaClient, guildId: string) {
	const defaultSettings = {
		guild_id: guildId,

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

		main_verification_button_id: '',
		veteran_verification_button_id: '',

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
	};

	await prisma.guilds.create({ data: defaultSettings });
	return defaultSettings;
}
