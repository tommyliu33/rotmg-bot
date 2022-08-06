import type { guilds } from '@prisma/client';
export function isVeteran(doc: guilds, id: string): boolean {
	const { veteranRaiding } = doc;

	if (veteranRaiding.statusChannelId === id) return true;
	if (veteranRaiding.controlPanelChannelId === id) return true;
	if (veteranRaiding.categoryId === id) return true;
	if (veteranRaiding.voiceChannelIds.includes(id)) return true;
	if (veteranRaiding.verificationChannelId === id) return true;

	return false;
}
