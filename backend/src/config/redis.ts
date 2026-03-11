import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redisConnection = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Req for BullMQ
});

redisConnection.on('error', (err) => {
    logger.error('[Redis] Connection error:', err.message);
});

redisConnection.on('connect', () => {
    logger.info(`[Redis] Connected to ${env.REDIS_HOST}:${env.REDIS_PORT}`);
});
