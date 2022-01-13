import { parentPort } from 'node:worker_threads';
import process from 'node:process';

if (parentPort) {
	parentPort.postMessage({ type: 0 });
} else {
	process.exit(0);
}
