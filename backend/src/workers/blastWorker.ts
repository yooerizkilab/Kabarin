import 'dotenv/config';
import { blastRepository } from '../repositories/blastRepository';
import { sessionManager } from '../baileys/sessionManager';
import { wsServer } from '../websocket/wsServer';
import { env } from '../config/env';

const POLL_INTERVAL = env.WORKER_INTERVAL_MS;
const MESSAGE_DELAY = env.MESSAGE_DELAY_MS;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processNextRecipient(): Promise<void> {
    // First activate any due scheduled jobs
    const dueJobs = await blastRepository.findDueScheduledJobs();
    for (const job of dueJobs) {
        await blastRepository.updateJobStatus(job.id, 'PENDING');
    }

    const [recipient] = await blastRepository.findPendingRecipients(1);
    if (!recipient) return;

    const job = recipient.blastJob as any;
    const device = job?.device;

    if (!device) {
        await blastRepository.updateRecipientStatus(recipient.id, 'FAILED', 'Device not found');
        return;
    }

    // Mark job as processing on first recipient
    if (job.status === 'PENDING') {
        await blastRepository.updateJobStatus(job.blastJobId || job.id, 'PROCESSING', {
            startedAt: new Date(),
        });
    }

    try {
        await sessionManager.sendTextMessage(device.id, recipient.phone, recipient.message);
        await blastRepository.updateRecipientStatus(recipient.id, 'SENT', undefined, new Date());

        // Broadcast to frontend
        wsServer.sendToDevice(device.id, 'blast_progress', {
            blastJobId: recipient.blastJobId,
            phone: recipient.phone,
            status: 'SENT',
        });
    } catch (err: any) {
        await blastRepository.updateRecipientStatus(recipient.id, 'FAILED', err.message);
        wsServer.sendToDevice(device.id, 'blast_progress', {
            blastJobId: recipient.blastJobId,
            phone: recipient.phone,
            status: 'FAILED',
            error: err.message,
        });
    }

    // Check if all recipients for this job are done
    const counts = await blastRepository.countRecipients(recipient.blastJobId);
    if (counts.pending === 0) {
        await blastRepository.updateJobStatus(recipient.blastJobId, 'COMPLETED', {
            completedAt: new Date(),
        });
        wsServer.broadcast('blast_completed', { blastJobId: recipient.blastJobId, stats: counts });
    }
}

async function startWorker(): Promise<void> {
    console.log(`[BlastWorker] Started. Poll interval: ${POLL_INTERVAL}ms, Message delay: ${MESSAGE_DELAY}ms`);

    // Restore active Baileys sessions
    await sessionManager.restoreAllSessions();

    while (true) {
        try {
            await processNextRecipient();
        } catch (err) {
            console.error('[BlastWorker] Error processing recipient:', err);
        }
        await sleep(MESSAGE_DELAY);
    }
}

startWorker().catch(console.error);
