import 'reflect-metadata';
import 'dotenv/config';

import { Bento, FSEntityLoader, EntityType } from '@ayanaware/bento';
import { logger } from './util/logger';

const bento = new Bento();
const fsel = new FSEntityLoader();

try {
	await bento.addPlugin(fsel);

	await fsel.addDirectory('./components', EntityType.COMPONENT);
	await fsel.addDirectory('./commands', EntityType.COMPONENT);

	await bento.verify();
} catch (e) {
	logger.error(e);
}
