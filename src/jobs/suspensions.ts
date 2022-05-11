import 'reflect-metadata'; // this needs to be kept to avoid polyfill error

import type { Database } from '#struct/Database';
import { parentPort } from 'node:worker_threads';
import { container } from 'tsyringe';
import { kDatabase } from '../tokens';

if (!container.isRegistered(kDatabase)) {
	process.exit(90);
}

const db = container.resolve<Database>(kDatabase);

if (parentPort) {
	// POST MESSAGE
	parentPort.postMessage({ msg: 'hello', guilds: db.guilds });
}

if (parentPort) {
	parentPort.postMessage('done');
} else {
	process.exit(0);
}
