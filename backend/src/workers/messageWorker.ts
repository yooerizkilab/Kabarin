import 'dotenv/config';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/prisma';
import { sessionManager } from '../baileys/sessionManager';
import { addMessageJob } from '../queues/messageQueue';
import { messageRepository } from '../repositories/messageRepository';

const worker = new Worker(
    'message-queue',
    async (job: Job) => {
        const { messageId } = job.data as { messageId: string };
        console.log(`[MessageWorker] Processing message: ${messageId}`);

        const message = await prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            console.error(`[MessageWorker] Message ${messageId} not found`);
            return;
        }

        if (message.status !== 'PENDING') {
            console.log(`[MessageWorker] Skip: Message ${messageId} status is ${message.status}`);
            return;
        }

        try {
            if (message.type === 'IMAGE' && message.mediaUrl) {
                await sessionManager.sendImageMessage(message.deviceId, message.to, message.mediaUrl, message.content);
            } else if (message.type === 'DOCUMENT' && message.mediaUrl) {
                const filename = message.mediaUrl.split('/').pop() || 'document.pdf';
                await sessionManager.sendDocumentMessage(message.deviceId, message.to, message.mediaUrl, filename);
                if (message.content) {
                    await sessionManager.sendTextMessage(message.deviceId, message.to, message.content);
                }
            } else {
                await sessionManager.sendTextMessage(message.deviceId, message.to, message.content);
            }

            await messageRepository.updateStatus(message.id, 'SENT', new Date());
            await messageRepository.addLog(message.id, 'sent');
        } catch (err: any) {
            console.error(`[MessageWorker] Failed to send ${messageId}:`, err.message);
            await messageRepository.updateStatus(message.id, 'FAILED');
            await messageRepository.addLog(message.id, 'failed', { error: err.message });
        }
    },
    {
        connection: redisConnection as ConnectionOptions,
        concurrency: 10,
    }
);

worker.on('failed', (job, err) => {
    console.error(`[MessageWorker] Job ${job?.id} failed:`, err.message);
});

console.log('[MessageWorker] BullMQ Message Worker started.');

// Re-sync pending scheduled messages on startup
async function backfillScheduledMessages() {
    const pendingScheduled = await prisma.message.findMany({
        where: { status: 'PENDING', scheduledAt: { not: null } }
    });

    for (const msg of pendingScheduled) {
        const delay = (msg as any).scheduledAt ? Math.max(0, new Date((msg as any).scheduledAt).getTime() - Date.now()) : 0;
        await addMessageJob(msg.id, delay);
    }
}

backfillScheduledMessages();
