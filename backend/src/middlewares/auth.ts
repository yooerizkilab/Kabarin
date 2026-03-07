import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
}

export async function isAdmin(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { role: string };
    if (user.role !== 'ADMIN') {
        return reply.status(403).send({ success: false, message: 'Forbidden: Admin access required' });
    }
}
