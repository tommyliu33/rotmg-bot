import type Bree from 'bree';

import { logger } from '../logger';

import { container } from 'tsyringe';
import { kBree } from '../tokens';

const bree = container.resolve<Bree>(kBree);

export function registerJobs() {
	bree.add({
		name: 'suspensions',
		interval: '1m',
		path: './jobs/suspensions.js',
	});
	logger.info('Registered suspensions job');
}

export function startJobs() {
	logger.info('Starting jobs');
	bree.start();
}
