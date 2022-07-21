import type { Entity, InstanceType } from '@ayanaware/bento';

import type { CommandManager } from './components/CommandManager';
import type { Command } from '#struct/Command';

export interface CommandEntity extends Entity, Command {
	parent: InstanceType<CommandManager>;
}
