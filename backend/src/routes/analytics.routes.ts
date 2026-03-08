import { FastifyInstance } from 'fastify';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middlewares/auth';

export async function analyticsRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', authenticate);

    fastify.get('/summary', analyticsController.getSummary);
    fastify.get('/chart', analyticsController.getChartData);
    fastify.get('/blasts', analyticsController.getBlastStats);
}
