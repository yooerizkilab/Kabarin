import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../config/prisma';

export const tagController = {
    async list(request: FastifyRequest, reply: FastifyReply) {
        const userId = (request.user as any).id;
        const tags = await prisma.tag.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        });
        return reply.send({ success: true, data: tags });
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
        const userId = (request.user as any).id;
        const { name, color } = request.body as { name: string; color?: string };

        const tag = await prisma.tag.create({
            data: {
                name,
                color,
                userId
            }
        });

        return reply.send({ success: true, data: tag });
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const { name, color } = request.body as { name: string; color?: string };

        const tag = await prisma.tag.update({
            where: { id },
            data: { name, color }
        });

        return reply.send({ success: true, data: tag });
    },

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };

        await prisma.tag.delete({
            where: { id }
        });

        return reply.send({ success: true, message: 'Tag deleted successfully' });
    }
};
