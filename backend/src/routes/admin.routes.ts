import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { adminController } from '../controllers/adminController';
import { isAdmin } from '../middlewares/auth';

export async function adminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // All routes in this plugin require JWT + Admin Role
    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            await isAdmin(request, reply);
        } catch (err: any) {
            reply.status(err.statusCode || 401).send(err);
        }
    });

    // Subscriptions Plans
    fastify.get('/plans', adminController.getPlans);
    fastify.post('/plans', adminController.createPlan);
    fastify.put('/plans/:id', adminController.updatePlan);
    fastify.delete('/plans/:id', adminController.deletePlan);

    // User Management
    fastify.get('/users', adminController.listUsers);
    fastify.put('/users/:id/subscription', adminController.updateUserSubscription);
}
