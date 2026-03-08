import { Queue, ConnectionOptions } from 'bullmq';
import { redisConnection } from '../config/redis';

export const messageQueue = new Queue('message-queue', {
    connection: redisConnection as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const addMessageJob = async (messageId: string, delayMs?: number) => {
    await messageQueue.add(
        'process-message',
        { messageId },
        { delay: delayMs || 0 }
    );
};
