import type { Event } from '../Event';

import { logger } from '../util/logger';

export default class implements Event {
	public name = 'ready';

	public execute() {
		if (process.argv.includes('--deploy')) void import('../util/deploy');

		logger.info('Logged in');
	}
}
