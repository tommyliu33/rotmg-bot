import type { Event } from '@struct';
import type { VoiceState } from 'discord.js';

export default class implements Event {
	public name = 'voiceStateUpdate';

	public execute(oldState: VoiceState, newState: VoiceState) {
		if (!oldState.deaf && newState.deaf) {
			console.log(`${oldState.member?.user.tag as string} deafened`);
		}
	}
}
