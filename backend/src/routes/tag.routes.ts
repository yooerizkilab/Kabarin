import { FastifyInstance } from 'fastify';
import { tagController } from '../controllers/tagController';
import { authenticate } from '../middlewares/auth';

export async function tagRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', tagController.list);
    fastify.post('/', tagController.create);
    fastify.put('/:id', tagController.update);
    fastify.delete('/:id', tagController.delete);
}
