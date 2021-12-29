import pino, { stdTimeFunctions } from 'pino';
export const logger = pino({
	timestamp: stdTimeFunctions.isoTime,
});
