import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/hash';

export const userRepository = {
    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    },

    async findById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    },

    async create(data: { email: string; password: string; name: string; role?: 'ADMIN' | 'USER' }) {
        const hashed = await hashPassword(data.password);
        return prisma.user.create({
            data: { ...data, password: hashed },
        });
    },
};
