import { container } from 'tsyringe';
import { kDatabase } from '../../tokens';
import type { Database } from '#struct/Database';

import type { ModLogCase } from './createCase';

type UpdatedCase = Pick<ModLogCase, 'processed' | 'reason'>;
// TODO: find better name
interface Thing {
	caseId: string;
	guildId: string;
}

// case_ is the new case data
export async function updateCase(thing: Thing, case_: UpdatedCase) {
	const db = container.resolve<Database>(kDatabase);

	const settings = await db.getModSettings(thing.guildId);
	const oldCaseIndex = settings!.cases.findIndex((c) => c.id === thing.caseId);
	const oldCase = settings!.cases[oldCaseIndex]!;

	// update the info
	if (case_.processed) {
		oldCase.actionProcessed = case_.processed;
	}

	if (case_.reason) {
		oldCase.reason = case_.reason;
	}

	// replace
	settings!.cases[oldCaseIndex] = oldCase;

	// update the case in db
	await db.guilds?.update({
		where: {
			guildId: thing.guildId,
		},
		data: {
			moderation: {
				update: {
					cases: settings!.cases,
				},
			},
		},
	});
}
