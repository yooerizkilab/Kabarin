import { FastifyInstance } from 'fastify';
import { chatController } from '../controllers/chatController';

export async function chatRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', fastify.authenticate);

    fastify.get('/', chatController.getChatList);
    fastify.get('/history', chatController.getChatHistory);
}
