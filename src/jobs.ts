import { logger } from './util/logger';

import { container } from 'tsyringe';
import { kBree } from './tokens';

import type Bree from 'bree/types';

export function startJobs() {
	const bree = container.resolve<Bree>(kBree);

	bree.add({
		name: 'suspensions',
		interval: '1s',
		path: './jobs/suspensions.js',
	});
	bree.run('suspensions');
	logger.info('Registered job: suspensionsJob');

	bree.on('worker created', (name: string) => {
		logger.info('worker created:', name);
	});

	bree.on('worker deleted', (name: string) => {
		bree.workers.get(name)?.removeAllListeners();
	});

	logger.info('Starting jobs');
}
