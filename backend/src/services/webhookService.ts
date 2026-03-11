import axios from 'axios';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface WebhookPayload {
    event: 'messages.upsert';
    device: string;
    message: {
        from: string;
        text: string;
    };
    timestamp: number;
}

export const webhookService = {
    /**
     * Mengirim POST request ke webhook URL milik user tanpa melakukan block/await ke parent function.
     */
    triggerWebhook(url: string, secret: string | null, payload: WebhookPayload): void {
        const payloadString = JSON.stringify(payload);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'WhatsAppGateway-Webhook/1.0',
        };

        // Jika secret disetel, buat HMAC SHA-256 signature supaya server penerima bisa memastikan
        // bahwa request benar-benar valid dan dari gateway kita.
        if (secret) {
            const signature = crypto
                .createHmac('sha256', secret)
                .update(payloadString)
                .digest('hex');

            headers['X-Hub-Signature-256'] = `sha256=${signature}`;
        }

        // Tembak secara async, tidak perlu await balasan/response. 
        // Jika gagal, hanya log saja (Fire and Forget)
        axios.post(url, payloadString, { headers, timeout: 5000 })
            .then((res) => {
                // logger.debug(`[Webhook] ✅ Successfully sent to ${url}. Status: ${res.status}`);
            })
            .catch((err) => {
                const status = err.response ? err.response.status : err.message;
                logger.error(`[Webhook] ❌ Failed to send to ${url}. Error: ${status}`);
            });
    }
};
