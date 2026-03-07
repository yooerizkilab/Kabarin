import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

interface WsClient {
    ws: WebSocket;
    userId?: string;
    deviceId?: string;
}

class WsServer {
    private clients: Set<WsClient> = new Set();

    handleConnection(ws: WebSocket) {
        const client: WsClient = { ws };
        this.clients.add(client);

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'subscribe') {
                    client.userId = msg.userId;
                    client.deviceId = msg.deviceId;
                }
            } catch { }
        });

        ws.on('close', () => {
            this.clients.delete(client);
        });

        ws.on('error', () => {
            this.clients.delete(client);
        });

        ws.send(JSON.stringify({ type: 'connected' }));
    }

    broadcast(event: string, payload: object, deviceId?: string) {
        const message = JSON.stringify({ type: event, data: payload });
        this.clients.forEach((client) => {
            if (client.ws.readyState !== WebSocket.OPEN) return;
            if (deviceId && client.deviceId && client.deviceId !== deviceId) return;
            client.ws.send(message);
        });
    }

    sendToDevice(deviceId: string, event: string, payload: object) {
        this.broadcast(event, payload, deviceId);
    }
}

export const wsServer = new WsServer();
