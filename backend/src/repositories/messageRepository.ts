import { prisma } from '../config/prisma';

export const messageRepository = {
    async create(data: {
        deviceId: string;
        to: string;
        type: 'TEXT' | 'IMAGE' | 'DOCUMENT';
        content: string;
        mediaUrl?: string;
    }) {
        return prisma.message.create({ data });
    },

    async updateStatus(id: string, status: string, sentAt?: Date) {
        return prisma.message.update({
            where: { id },
            data: { status: status as any, ...(sentAt && { sentAt }) },
        });
    },

    async addLog(messageId: string, event: string, data?: object) {
        return prisma.messageLog.create({
            data: { messageId, event, data: data as any },
        });
    },

    async findAll(filters: { deviceId?: string; status?: string; limit?: number; offset?: number }) {
        const { deviceId, status, limit = 50, offset = 0 } = filters;
        return prisma.message.findMany({
            where: {
                ...(deviceId && { deviceId }),
                ...(status && { status: status as any }),
            },
            include: { device: { select: { name: true } }, logs: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    },

    async count(filters: { deviceId?: string; status?: string }) {
        return prisma.message.count({ where: filters as any });
    },
};
