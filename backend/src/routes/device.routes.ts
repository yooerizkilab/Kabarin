import { FastifyInstance } from 'fastify';
import { deviceController } from '../controllers/deviceController';
import { authenticate } from '../middlewares/auth';

export async function deviceRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', deviceController.list);
    fastify.post('/connect', deviceController.connect);
    fastify.get('/:id/status', deviceController.getStatus);
    fastify.delete('/:id', deviceController.disconnect);
}
