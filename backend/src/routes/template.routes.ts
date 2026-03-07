import { FastifyInstance } from 'fastify';
import { templateController } from '../controllers/templateController';
import { authenticate } from '../middlewares/auth';

export async function templateRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', templateController.list);
    fastify.post('/', templateController.create);
    fastify.put('/:id', templateController.update);
    fastify.delete('/:id', templateController.delete);
}
