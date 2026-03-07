import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma';
import { midtransService } from '../services/midtransService';

export const billingController = {
    // 1. Get List Plans (Publik/User)
    async getPlans(request: FastifyRequest, reply: FastifyReply) {
        try {
            const plans = await prisma.subscriptionPlan.findMany({
                orderBy: { price: 'asc' }
            });
            return reply.send({ data: plans });
        } catch (error) {
            console.error('Failed to get subscription plans:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    },

    // 2. Buy / Checkout a Plan
    async checkout(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;
            const { planId } = request.body as { planId: string };

            // Ambil User
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return reply.code(404).send({ message: 'User not found' });

            // Ambil Detail Plan
            const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
            if (!plan) return reply.code(404).send({ message: 'Plan not found' });

            // Buat draft Transaction di database
            const transaction = await prisma.paymentTransaction.create({
                data: {
                    userId,
                    planId,
                    amount: plan.price,
                    status: 'PENDING'
                }
            });

            // Jika package gratis (harga 0), langsung saja proses aktif
            if (plan.price <= 0) {
                // Langsung aktivasi tanpa midtrans
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30); // Aktif 30 hari

                await prisma.$transaction([
                    prisma.paymentTransaction.update({
                        where: { id: transaction.id },
                        data: { status: 'PAID' }
                    }),
                    prisma.user.update({
                        where: { id: userId },
                        data: {
                            subscriptionPlanId: plan.id,
                            subscriptionStatus: 'ACTIVE',
                            subscriptionEndDate: endDate,
                            messagesSentThisMonth: 0 // Reset Kuota
                        }
                    })
                ]);

                return reply.send({
                    message: 'Free plan activated',
                    isFree: true
                });
            }

            // Jika berbayar, panggil Midtrans Snap Token
            const tokenResponse = await midtransService.createTransactionToken(
                transaction.id, // Gunakan transactional id kita sebagai Order ID midtrans
                Math.round(plan.price),
                {
                    first_name: user.name,
                    email: user.email,
                },
                [
                    {
                        id: plan.id,
                        price: Math.round(plan.price),
                        quantity: 1,
                        name: `Langganan ${plan.name} (30 Hari)`
                    }
                ]
            );

            // Simpan token di Transaction kita
            await prisma.paymentTransaction.update({
                where: { id: transaction.id },
                data: {
                    paymentToken: tokenResponse.token,
                    paymentGatewayUrl: tokenResponse.redirect_url
                }
            });

            return reply.send({
                message: 'Checkout successful',
                token: tokenResponse.token,
                redirect_url: tokenResponse.redirect_url,
                transactionId: transaction.id
            });
        } catch (error) {
            console.error('Failed to checkout:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    },

    // 3. Status User Saat Ini & Riwayat Transaksi
    async getMyBilling(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request.user as any).id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    subscriptionPlan: true
                }
            });

            const transactions = await prisma.paymentTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: { plan: true }
            });

            return reply.send({
                data: {
                    currentPlan: user?.subscriptionPlan || null,
                    subscriptionStatus: user?.subscriptionStatus,
                    subscriptionEndDate: user?.subscriptionEndDate,
                    messagesSentThisMonth: user?.messagesSentThisMonth,
                    transactions
                }
            });
        } catch (error) {
            console.error('Failed to get billing info:', error);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    },

    // 4. Midtrans Webhook Notification
    async midtransWebhook(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Midtrans webhook HTTP payload
            const notificationJson = request.body as any;

            // Verifikasi HMAC Payload via library
            const statusResponse = await midtransService.verifyNotification(notificationJson);

            const orderId = statusResponse.order_id;
            const transactionStatus = statusResponse.transaction_status;
            const fraudStatus = statusResponse.fraud_status;

            console.log(`[Midtrans Webhook] Transaction ${orderId} received. Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

            const transactionDb = await prisma.paymentTransaction.findUnique({ where: { id: orderId } });
            if (!transactionDb) {
                console.warn(`[Midtrans Webhook] Transaction ID ${orderId} not found in database.`);
                return reply.code(404).send('Transaction not found');
            }

            // Status Map
            // PENDING, PAID, FAILED
            let newStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
            let isSuccess = false;

            if (transactionStatus == 'capture') {
                if (fraudStatus == 'challenge') {
                    // Ccard challenge
                    newStatus = 'PENDING';
                } else if (fraudStatus == 'accept') {
                    newStatus = 'PAID';
                    isSuccess = true;
                }
            } else if (transactionStatus == 'settlement') {
                newStatus = 'PAID';
                isSuccess = true;
            } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
                newStatus = 'FAILED';
            } else if (transactionStatus == 'pending') {
                newStatus = 'PENDING';
            }

            // Update Transaction di Database
            if (transactionDb.status !== newStatus) {
                await prisma.paymentTransaction.update({
                    where: { id: orderId },
                    data: { status: newStatus }
                });

                // Jika SUCCESS, maka aktifkan akun User:
                // - Set plan jadi plan transaksi ini
                // - Status langganan ACTIVE
                // - End Date +30 Hari
                // - Reset Kuota Pesan
                if (isSuccess && transactionDb.status !== 'PAID') {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 30); // bergulir 30 hari

                    await prisma.user.update({
                        where: { id: transactionDb.userId },
                        data: {
                            subscriptionPlanId: transactionDb.planId,
                            subscriptionStatus: 'ACTIVE',
                            subscriptionEndDate: endDate,
                            messagesSentThisMonth: 0
                        }
                    });

                    console.log(`[Billing] User ${transactionDb.userId} plan activated to ${transactionDb.planId}`);
                }
            }

            // Kembalikan Http 200 supaya midtrans tidak retry
            return reply.send({ status: 'ok' });
        } catch (error) {
            console.error('[Midtrans Webhook] Error processing notification:', error);
            // Tetap reply ok atau 500 tergantung preferensi.
            // Jika 500, midtrans akan retry push webhook-nya.
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    }
};
