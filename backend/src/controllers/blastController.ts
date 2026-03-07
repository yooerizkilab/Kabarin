import { FastifyRequest, FastifyReply } from 'fastify';
import { blastRepository } from '../repositories/blastRepository';
import { contactRepository } from '../repositories/contactRepository';
import { resolveTemplate } from '../utils/csvParser';
import { prisma } from '../config/prisma';

export const blastController = {
    async create(request: FastifyRequest, reply: FastifyReply) {
        const { id: userId } = request.user as { id: string };
        const {
            deviceId,
            templateId,
            name,
            message,
            groupId,
            scheduledAt,
        } = request.body as {
            deviceId: string;
            templateId?: string;
            name: string;
            message: string;
            groupId?: string;
            scheduledAt?: string;
        };

        // Create blast job
        const job = await blastRepository.createJob({
            userId,
            deviceId,
            templateId,
            name,
            message,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        });

        // Get contacts
        const contacts = await contactRepository.findAll(userId, groupId);
        if (contacts.length === 0) {
            return reply.status(400).send({ success: false, message: 'No contacts found for blast' });
        }

        // Create recipient queue rows
        const recipients = contacts.map((c: any) => ({
            blastJobId: job.id,
            contactId: c.id,
            phone: c.phone,
            message: resolveTemplate(message, { name: c.name, phone: c.phone, email: c.email || '' }),
        }));

        await blastRepository.createRecipients(recipients);

        // Limit Quota Increment
        await prisma.user.update({
            where: { id: userId },
            data: { messagesSentThisMonth: { increment: recipients.length } }
        });

        return reply.status(201).send({
            success: true,
            data: { jobId: job.id, recipientCount: recipients.length },
            message: 'Blast job created. Worker will start processing.',
        });
    },

    async list(request: FastifyRequest, reply: FastifyReply) {
        const { id: userId } = request.user as { id: string };
        const jobs = await blastRepository.findJobsByUser(userId);
        return reply.send({ success: true, data: jobs });
    },

    async getJob(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const job = await blastRepository.findJobById(id);
        if (!job) return reply.status(404).send({ success: false, message: 'Blast job not found' });
        const counts = await blastRepository.countRecipients(id);
        return reply.send({ success: true, data: { ...job, stats: counts } });
    },
};
