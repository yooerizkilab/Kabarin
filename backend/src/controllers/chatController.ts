import { FastifyRequest, FastifyReply } from 'fastify';
import { messageRepository } from '../repositories/messageRepository';

export const chatController = {
    async getChatList(request: FastifyRequest, reply: FastifyReply) {
        const { deviceId } = request.query as { deviceId: string };
        if (!deviceId) return reply.status(400).send({ message: 'Device ID is required' });

        const chats = await messageRepository.getChatList(deviceId);
        return reply.send({ success: true, data: chats });
    },

    async getChatHistory(request: FastifyRequest, reply: FastifyReply) {
        const { deviceId, phone } = request.query as { deviceId: string; phone: string };
        if (!deviceId || !phone) {
            return reply.status(400).send({ message: 'Device ID and Phone are required' });
        }

        const history = await messageRepository.getChatHistory(deviceId, phone);
        return reply.send({ success: true, data: history });
    },
};
