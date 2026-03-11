import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

// Konfigurasi Default Plan jika User belum langganan (Free Tier)
const DEFAULT_FREE_PLAN = {
    maxDevices: 1,
    maxMessagesPerMonth: 100,
};

export const quotaMiddleware = {
    /**
     * Middleware untuk mengecek batasan limit Device sebelum Create Device
     */
    async checkDeviceQuota(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { subscriptionPlan: true }
            });

            if (!user) return reply.code(401).send({ message: 'Unauthorized' });

            // Admin bypass
            if (user.role === 'ADMIN') return;

            const currentDeviceCount = await prisma.device.count({
                where: { userId }
            });

            const maxDevices = user.subscriptionStatus === 'ACTIVE' && user.subscriptionPlan
                ? user.subscriptionPlan.maxDevices
                : DEFAULT_FREE_PLAN.maxDevices;

            if (currentDeviceCount >= maxDevices) {
                return reply.code(403).send({ message: `Quota Exceeded: You have reached the maximum device limit (${maxDevices}) for your plan.` });
            }
        } catch (error) {
            logger.error('Device quota check error:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    },

    /**
     * Middleware untuk mengecek batasan pengiriman pesan (Messages/Blast)
     */
    async checkMessageQuota(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { subscriptionPlan: true }
            });

            if (!user) return reply.code(401).send({ message: 'Unauthorized' });

            // Admin bypass
            if (user.role === 'ADMIN') return;

            const maxMessages = user.subscriptionStatus === 'ACTIVE' && user.subscriptionPlan
                ? user.subscriptionPlan.maxMessagesPerMonth
                : DEFAULT_FREE_PLAN.maxMessagesPerMonth;

            // Jika ada payload berupa array (contoh blast) kita harus cek totalnya.
            let outgoingCount = 1;
            if (request.body && typeof request.body === 'object') {
                const body = request.body as any;
                if (Array.isArray(body.recipients)) {
                    outgoingCount = body.recipients.length; // Estimasi Blast
                } else if (Array.isArray(body)) {
                    outgoingCount = body.length; // Estimasi json array
                }
            }

            if (user.messagesSentThisMonth + outgoingCount > maxMessages) {
                return reply.code(403).send({
                    message: `Quota Exceeded: Message limit reached. You can only send ${maxMessages - user.messagesSentThisMonth} more messages this month.`
                });
            }

            // Catatan: increment messagesSentThisMonth harus dilakukan di Controller 
            // seteleh pesan "BENAR-BENAR" dikirimkan atau dijadwalkan.
        } catch (error) {
            logger.error('Message quota check error:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    }
};
