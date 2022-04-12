export const HEADCOUNT = (dungeonName: string, dungeonEmoji: string, voiceChannel: string) =>
	`@here \`${dungeonName}\` ${dungeonEmoji} Headcount for ${voiceChannel}`;

export const AFKCHECK = (dungeonName: string, dungeonEmoji: string, voiceChannel: string) =>
	`@here \`${dungeonName}\` ${dungeonEmoji} is now starting in ${voiceChannel}`;

export const RAID_MESSAGE = (dungeonName: string, dungeonEmoji: string, voiceChannel: string, isRaid: boolean) =>
	`@here \`${dungeonName}\` ${dungeonEmoji} ${isRaid ? 'is now starting in' : 'Headcount for'} ${voiceChannel}`;
