import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    const existing = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    if (!existing) {
        const hashed = await bcrypt.hash('admin123', 12);
        await prisma.user.create({
            data: {
                email: 'admin@example.com',
                password: hashed,
                name: 'Admin',
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin user created: admin@example.com / admin123');
    } else {
        console.log('ℹ️  Admin user already exists.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
