import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    WASocket,
    proto,
    AnyMessageContent,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../config/env';
import { wsServer } from '../websocket/wsServer';
import { prisma } from '../config/prisma';
import { autoResponderRepository } from '../repositories/autoResponderRepository';
import { callAI } from '../services/aiService';
import { webhookRepository } from '../repositories/webhookRepository';
import { webhookService } from '../services/webhookService';
import { messageRepository } from '../repositories/messageRepository';

export interface DeviceSession {
    socket: WASocket;
    deviceId: string;
}

class SessionManager {
    private sessions = new Map<string, DeviceSession>();

    getSession(deviceId: string): DeviceSession | undefined {
        return this.sessions.get(deviceId);
    }

    getAllSessions(): Map<string, DeviceSession> {
        return this.sessions;
    }

    async createSession(deviceId: string): Promise<void> {
        const sessionPath = path.join(env.SESSION_DIR, deviceId);

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const socket = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['WhatsApp Gateway', 'Chrome', '1.0.0'],
        });

        this.sessions.set(deviceId, { socket, deviceId });

        await this.registerEvents(socket, deviceId, saveCreds);
    }

    private async registerEvents(
        socket: WASocket,
        deviceId: string,
        saveCreds: () => Promise<void>
    ) {
        socket.ev.on('creds.update', saveCreds);

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                // Send QR to frontend via WebSocket
                wsServer.sendToDevice(deviceId, 'qr_update', { deviceId, qr });
                try {
                    await prisma.device.update({
                        where: { id: deviceId },
                        data: { status: 'QR_REQUIRED' },
                    });
                } catch (err) {
                    console.log(`[Baileys] Ignored QR update for missing device: ${deviceId}`);
                }
            }

            if (connection === 'open') {
                const phoneNumber = socket.user?.id?.split(':')[0] || null;
                try {
                    await prisma.device.update({
                        where: { id: deviceId },
                        data: { status: 'CONNECTED', phoneNumber },
                    });
                } catch (err) {
                    console.log(`[Baileys] Ignored connection open for missing device: ${deviceId}`);
                }
                wsServer.sendToDevice(deviceId, 'device_status', {
                    deviceId,
                    status: 'CONNECTED',
                    phoneNumber,
                });
            }

            if (connection === 'close') {
                const shouldReconnect =
                    (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

                try {
                    await prisma.device.update({
                        where: { id: deviceId },
                        data: { status: 'DISCONNECTED' },
                    });
                } catch (err) {
                    console.log(`[Baileys] Ignored disconnect for missing device: ${deviceId}`);
                }

                wsServer.sendToDevice(deviceId, 'device_status', {
                    deviceId,
                    status: 'DISCONNECTED',
                });

                if (shouldReconnect) {
                    setTimeout(() => this.createSession(deviceId), 5000);
                } else {
                    this.sessions.delete(deviceId);
                    // clear session files on logout
                    const sessionPath = path.join(env.SESSION_DIR, deviceId);
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            }
        });

        socket.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return; // Hanya proses pesan baru

            for (const msg of messages) {
                if (!msg.key.fromMe && msg.message) {
                    const from = msg.key.remoteJid || '';

                    // Ekstrak teks dari berbagai kemungkinan payload WhatsApp
                    const text =
                        msg.message.conversation ||
                        msg.message.extendedTextMessage?.text ||
                        msg.message.imageMessage?.caption ||
                        msg.message.videoMessage?.caption ||
                        '';

                    console.log(`[WhatsApp] Incoming message to ${deviceId} from ${from}: "${text}"`);

                    // Persist to Database
                    try {
                        await messageRepository.upsertIncoming({
                            deviceId,
                            from,
                            to: socket.user?.id || '', // Our own number/ID if known
                            externalId: msg.key.id || '',
                            type: 'TEXT',
                            content: text,
                            status: 'READ',
                        });
                    } catch (err: any) {
                        console.error(`[Inbox] Error saving incoming message:`, err.message);
                    }

                    // Broadcast incoming message to frontend (Legacy + Sync)
                    wsServer.sendToDevice(deviceId, 'incoming_message', {
                        deviceId,
                        from,
                        text,
                    });
                    wsServer.sendToDevice(deviceId, 'new_message', {
                        deviceId,
                        from,
                        text,
                        direction: 'INCOMING'
                    });

                    // Tangani Webhook
                    try {
                        const webhook = await webhookRepository.findActiveByDeviceId(deviceId);
                        if (webhook) {
                            webhookService.triggerWebhook(webhook.url, webhook.secret, {
                                event: 'messages.upsert',
                                device: deviceId,
                                message: { from, text },
                                timestamp: Date.now(),
                            });
                        }
                    } catch (err: any) {
                        console.error(`[Webhook] Error finding webhook for device ${deviceId}:`, err.message);
                    }

                    // Auto-responder
                    if (text) {
                        await this.handleAutoRespond(deviceId, from, text);
                    }
                }
            }
        });

        socket.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                if (update.update.status) {
                    wsServer.broadcast('message_status', {
                        key: update.key,
                        status: update.update.status,
                    });
                }
            }
        });
    }

    async sendTextMessage(deviceId: string, to: string, text: string): Promise<void> {
        const session = this.sessions.get(deviceId);
        if (!session) throw new Error(`Device ${deviceId} is not connected`);
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        await session.socket.sendMessage(jid, { text });
    }

    async sendImageMessage(
        deviceId: string,
        to: string,
        imageUrl: string,
        caption?: string
    ): Promise<void> {
        const session = this.sessions.get(deviceId);
        if (!session) throw new Error(`Device ${deviceId} is not connected`);
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        await session.socket.sendMessage(jid, {
            image: { url: imageUrl },
            caption,
        });
    }

    async sendDocumentMessage(
        deviceId: string,
        to: string,
        docUrl: string,
        filename: string,
        mimetype = 'application/octet-stream'
    ): Promise<void> {
        const session = this.sessions.get(deviceId);
        if (!session) throw new Error(`Device ${deviceId} is not connected`);
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        await session.socket.sendMessage(jid, {
            document: { url: docUrl },
            fileName: filename,
            mimetype,
        });
    }

    async destroySession(deviceId: string): Promise<void> {
        const session = this.sessions.get(deviceId);
        if (session) {
            await session.socket.logout();
            this.sessions.delete(deviceId);
        }
        const sessionPath = path.join(env.SESSION_DIR, deviceId);
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    async restoreAllSessions(): Promise<void> {
        const devices = await prisma.device.findMany({
            where: { status: { in: ['CONNECTED', 'QR_REQUIRED', 'CONNECTING'] } },
        });
        for (const device of devices) {
            try {
                await this.createSession(device.id);
            } catch (err) {
                console.error(`Failed to restore session for device ${device.id}:`, err);
            }
        }
    }

    /**
     * Handle auto-respond logic for incoming messages.
     * 1. Match keyword rules (sorted by order).
     * 2. If no match and AI is configured → call AI and reply.
     */
    async handleAutoRespond(deviceId: string, from: string, text: string): Promise<void> {
        try {
            const autoResponder = await autoResponderRepository.findActiveByDeviceId(deviceId);
            if (!autoResponder) return;

            // ── Quota Check ─────────────────────────────────────
            const user: any = autoResponder.user;
            const isAdmin = user.role === 'ADMIN';

            if (!isAdmin) {
                const maxMessages = user.subscriptionStatus === 'ACTIVE' && user.subscriptionPlan
                    ? user.subscriptionPlan.maxMessagesPerMonth
                    : 100; // Default Free Tier

                if (user.messagesSentThisMonth >= maxMessages) {
                    console.log(`[AutoResponder] Quota exceeded for user ${user.id}. Skipping reply.`);
                    return;
                }
            }

            const normalizedText = text.trim().toLowerCase();
            let replied = false;

            // ── 1. Keyword rules ───────────────────────────────────
            for (const rule of autoResponder.rules) {
                if (!rule.isActive) continue;

                let keywords = rule.keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
                const matchType = rule.matchType.toUpperCase();

                // Spesial untuk REGEX, kita tidak pisahkan berdasarkan koma agar regex utuh
                if (matchType === 'REGEX') {
                    keywords = [rule.keywords.trim()];
                }

                const matched = keywords.some((kw: string) => {
                    switch (matchType) {
                        case 'EXACT': return normalizedText === kw;
                        case 'STARTSWITH': return normalizedText.startsWith(kw);
                        case 'REGEX': try { return new RegExp(kw, 'i').test(text); } catch { return false; }
                        case 'CONTAINS':
                        default: return normalizedText.includes(kw);
                    }
                });

                if (matched) {
                    await this.sendTextMessage(deviceId, from, rule.response);
                    console.log(`[AutoResponder] Keyword match (${matchType}): "${text}" → rule ${rule.id}`);
                    replied = true;

                    // Increment Quota (Skip if ADMIN)
                    if (!isAdmin) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { messagesSentThisMonth: { increment: 1 } }
                        });
                    }
                    break;
                }
            }

            // ── 2. AI fallback ─────────────────────────────────────
            if (!replied && autoResponder.aiProvider) {
                const aiReply = await callAI(
                    autoResponder.aiProvider,
                    autoResponder.aiModel || '',
                    autoResponder.systemPrompt || 'You are a helpful WhatsApp assistant. Reply concisely.',
                    text
                );
                await this.sendTextMessage(deviceId, from, aiReply);
                console.log(`[AutoResponder] AI (${autoResponder.aiProvider}) replied to: "${text}"`);

                // Increment Quota (Skip if ADMIN)
                if (!isAdmin) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { messagesSentThisMonth: { increment: 1 } }
                    });
                }
            }
        } catch (err: any) {
            console.error(`[AutoResponder] Error handling auto-respond for device ${deviceId}:`, err.message);
        }
    }
}

export const sessionManager = new SessionManager();
