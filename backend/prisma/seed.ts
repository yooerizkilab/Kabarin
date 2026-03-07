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

    // ── Seed Subscription Plans ──────────────────────────────
    console.log('🌱 Seeding subscription plans...');
    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            maxDevices: 1,
            maxMessagesPerMonth: 100,
            features: JSON.stringify({
                api: 'Basic API Access',
                support: 'Community Support',
            }),
        },
        {
            id: 'starter',
            name: 'Starter',
            price: 50000,
            maxDevices: 3,
            maxMessagesPerMonth: 5000,
            features: JSON.stringify({
                api: 'Standard API Access',
                support: 'Email Support',
                blast: 'Blast Campaigns Enabled',
            }),
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 150000,
            maxDevices: 10,
            maxMessagesPerMonth: 50000,
            features: JSON.stringify({
                api: 'High Speed API',
                support: 'Priority 24/7 Support',
                blast: 'Advanced Blast Campaigns',
                ai: 'AI Auto-Responder Enabled',
            }),
        },
    ];

    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: { id: plan.id },
            update: plan,
            create: plan,
        });
    }
    console.log('✅ Subscription plans seeded.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
