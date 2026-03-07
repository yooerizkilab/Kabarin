import { FastifyRequest, FastifyReply } from 'fastify';
import { templateRepository } from '../repositories/templateRepository';

export const templateController = {
    async list(request: FastifyRequest, reply: FastifyReply) {
        const { id: userId } = request.user as { id: string };
        const templates = await templateRepository.findAll(userId);
        return reply.send({ success: true, data: templates });
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
        const { id: userId } = request.user as { id: string };
        const { name, content, variables } = request.body as {
            name: string;
            content: string;
            variables?: string[];
        };
        const template = await templateRepository.create({ userId, name, content, variables });
        return reply.status(201).send({ success: true, data: template });
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as Partial<{ name: string; content: string; variables: string[] }>;
        const template = await templateRepository.update(id, data);
        return reply.send({ success: true, data: template });
    },

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        await templateRepository.delete(id);
        return reply.send({ success: true, message: 'Template deleted' });
    },
};
