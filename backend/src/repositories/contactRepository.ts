import { prisma } from '../config/prisma';

export const contactRepository = {
    async findAll(userId: string, groupId?: string) {
        return prisma.contact.findMany({
            where: { userId, ...(groupId && { groupId }) },
            include: { group: true },
            orderBy: { name: 'asc' },
        });
    },

    async findById(id: string) {
        return prisma.contact.findUnique({ where: { id }, include: { group: true } });
    },

    async create(data: { userId: string; name: string; phone: string; email?: string; groupId?: string }) {
        return prisma.contact.create({ data });
    },

    async createMany(contacts: { userId: string; name: string; phone: string; email?: string; groupId?: string }[]) {
        return prisma.contact.createMany({ data: contacts, skipDuplicates: true });
    },

    async update(id: string, data: Partial<{ name: string; phone: string; email: string; groupId: string }>) {
        return prisma.contact.update({ where: { id }, data });
    },

    async delete(id: string) {
        return prisma.contact.delete({ where: { id } });
    },

    async findGroups(userId: string) {
        return prisma.contactGroup.findMany({ where: { userId }, orderBy: { name: 'asc' } });
    },

    async createGroup(userId: string, name: string) {
        return prisma.contactGroup.create({ data: { userId, name } });
    },

    async countByGroup(groupId: string) {
        return prisma.contact.count({ where: { groupId } });
    },
};
