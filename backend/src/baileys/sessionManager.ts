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

        socket.ev.on('messages.upsert', async ({ messages }) => {
            for (const msg of messages) {
                if (!msg.key.fromMe && msg.message) {
                    // Log incoming message (extend as needed)
                    const from = msg.key.remoteJid || '';
                    const text =
                        msg.message.conversation ||
                        msg.message.extendedTextMessage?.text ||
                        '';
                    wsServer.sendToDevice(deviceId, 'incoming_message', {
                        deviceId,
                        from,
                        text,
                    });
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
}

export const sessionManager = new SessionManager();
