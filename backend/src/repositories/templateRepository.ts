import { prisma } from '../config/prisma';

export const templateRepository = {
    async findAll(userId: string) {
        return prisma.template.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    },

    async findById(id: string) {
        return prisma.template.findUnique({ where: { id } });
    },

    async create(data: { userId: string; name: string; content: string; variables?: string[] }) {
        return prisma.template.create({ data: { ...data, variables: data.variables as any } });
    },

    async update(id: string, data: Partial<{ name: string; content: string; variables: string[] }>) {
        return prisma.template.update({ where: { id }, data: { ...data, variables: data.variables as any } });
    },

    async delete(id: string) {
        return prisma.template.delete({ where: { id } });
    },
};
