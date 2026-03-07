import midtransClient from 'midtrans-client';
import { env } from '../config/env';

// Create Snap API instance
export const snap = new midtransClient.Snap({
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.MIDTRANS_CLIENT_KEY,
});

// Create Core API instance (opsional jika butuh verifikasi signature manually)
export const coreApi = new midtransClient.CoreApi({
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.MIDTRANS_CLIENT_KEY,
});

export const midtransService = {
    /**
     * Meminta token pembayaran Snap (Popup) dari Midtrans.
     */
    async createTransactionToken(orderId: string, grossAmount: number, customerDetails: any, itemDetails: any[]) {
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
            credit_card: {
                secure: true,
            },
            customer_details: customerDetails,
            item_details: itemDetails,
        };

        const transaction = await snap.createTransaction(parameter);
        return transaction; // { token: '...', redirect_url: '...' }
    },

    /**
     * Memverifikasi Webhook HTTP Notification dari Midtrans.
     */
    async verifyNotification(notificationBody: any) {
        // midtransClient.CoreApi.transaction.notification() throws if invalid
        // @ts-ignore
        const statusResponse = await coreApi.transaction.notification(notificationBody);
        return statusResponse;
    }
};
