import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { billingController } from '../controllers/billingController';

export async function billingRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // Rute Publik
    fastify.get('/plans', billingController.getPlans);

    // Webhook Midtrans - Publik tanpa JWT Auth 
    fastify.post('/webhook', billingController.midtransWebhook);

    // Rute Terproteksi JWT
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.send(err);
            }
        });

        protectedRoutes.post('/checkout', billingController.checkout);
        protectedRoutes.get('/me', billingController.getMyBilling);
    });
}
