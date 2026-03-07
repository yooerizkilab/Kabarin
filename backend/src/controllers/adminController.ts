import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma';

export const adminController = {
    // ── Plans Management ─────────────────────────────────────
    async getPlans(request: FastifyRequest, reply: FastifyReply) {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { price: 'asc' }
        });
        return reply.send({ success: true, data: plans });
    },

    async createPlan(request: FastifyRequest, reply: FastifyReply) {
        const { name, price, maxDevices, maxMessagesPerMonth, features } = request.body as any;
        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                price: parseInt(price),
                maxDevices: parseInt(maxDevices),
                maxMessagesPerMonth: parseInt(maxMessagesPerMonth),
                features: features || {}
            }
        });
        return reply.status(201).send({ success: true, data: plan });
    },

    async updatePlan(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;

        // Sanitize numeric fields
        if (data.price !== undefined) data.price = parseInt(data.price);
        if (data.maxDevices !== undefined) data.maxDevices = parseInt(data.maxDevices);
        if (data.maxMessagesPerMonth !== undefined) data.maxMessagesPerMonth = parseInt(data.maxMessagesPerMonth);

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data
        });
        return reply.send({ success: true, data: plan });
    },

    async deletePlan(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        await prisma.subscriptionPlan.delete({ where: { id } });
        return reply.send({ success: true, message: 'Plan deleted' });
    },

    // ── User Management ──────────────────────────────────────
    async listUsers(request: FastifyRequest, reply: FastifyReply) {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                subscriptionStatus: true,
                subscriptionEndDate: true,
                messagesSentThisMonth: true,
                subscriptionPlan: {
                    select: { name: true }
                },
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return reply.send({ success: true, data: users });
    },

    async updateUserSubscription(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const {
            subscriptionPlanId,
            subscriptionStatus,
            subscriptionEndDate,
            messagesSentThisMonth
        } = request.body as any;

        const updateData: any = {};
        if (subscriptionPlanId !== undefined) updateData.subscriptionPlanId = subscriptionPlanId;
        if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
        if (subscriptionEndDate !== undefined) updateData.subscriptionEndDate = new Date(subscriptionEndDate);
        if (messagesSentThisMonth !== undefined) updateData.messagesSentThisMonth = parseInt(messagesSentThisMonth);

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return reply.send({ success: true, data: user, message: 'User subscription updated' });
    }
};
