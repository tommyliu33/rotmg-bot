import type { GuildDocument } from '#util/mongo';

export function isVeteran(doc: GuildDocument, id: string): boolean {
	const { veteran_raiding } = doc;

	if (veteran_raiding.status_channel_id === id) return true;
	if (veteran_raiding.control_panel_channel_id === id) return true;
	if (veteran_raiding.category_id === id) return true;
	if (veteran_raiding.voice_channel_ids.includes(id)) return true;
	if (veteran_raiding.verification_channel_id === id) return true;

	return false;
}
