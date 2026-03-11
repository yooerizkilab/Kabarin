import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';
import { webhookRepository } from '../repositories/webhookRepository';

export const webhookController = {
    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;
            const webhooks = await webhookRepository.findAllByUserId(userId);
            return reply.send({ data: webhooks });
        } catch (error) {
            logger.error('Failed to list webhooks:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;
            const { deviceId, url, secret } = request.body as any;

            if (!deviceId || !url) {
                return reply.code(400).send({ message: 'deviceId and url are required' });
            }

            // Validasi URL
            try { new URL(url); } catch {
                return reply.code(400).send({ message: 'URL format is invalid' });
            }

            // Pastikan device belum punya webhook (1 device = 1 webhook aktif)
            const existing = await webhookRepository.findActiveByDeviceId(deviceId);
            if (existing) {
                return reply.code(400).send({ message: 'This device already has a webhook configured' });
            }

            const webhook = await webhookRepository.create({
                userId,
                deviceId,
                url,
                secret: secret || null,
            });

            return reply.code(201).send({ message: 'Webhook created successfully', data: webhook });
        } catch (error) {
            logger.error('Failed to create webhook:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;
            const { id } = request.params as { id: string };
            const { url, secret, isActive } = request.body as any;

            const existing = await webhookRepository.findById(id);
            if (!existing) {
                return reply.code(404).send({ message: 'Webhook not found' });
            }

            if (existing.userId !== userId) {
                return reply.code(403).send({ message: 'Forbidden' });
            }

            if (url) {
                try { new URL(url); } catch {
                    return reply.code(400).send({ message: 'URL format is invalid' });
                }
            }

            const payload: any = {};
            if (url !== undefined) payload.url = url;
            if (secret !== undefined) payload.secret = secret;
            if (isActive !== undefined) payload.isActive = isActive;

            const webhook = await webhookRepository.update(id, payload);
            return reply.send({ message: 'Webhook updated successfully', data: webhook });
        } catch (error) {
            logger.error('Failed to update webhook:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    },

    async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;
            const { id } = request.params as { id: string };

            const existing = await webhookRepository.findById(id);
            if (!existing) {
                return reply.code(404).send({ message: 'Webhook not found' });
            }

            if (existing.userId !== userId) {
                return reply.code(403).send({ message: 'Forbidden' });
            }

            await webhookRepository.delete(id);
            return reply.send({ message: 'Webhook deleted successfully' });
        } catch (error) {
            logger.error('Failed to delete webhook:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    }
};
