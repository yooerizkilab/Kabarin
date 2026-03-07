'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/deviceStore';

export function useWebSocket(userId?: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const { updateDeviceStatus, setQrCode, clearQrCode } = useDeviceStore();

    useEffect(() => {
        if (!userId) return;

        const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
        const wsUrl = baseUrl.endsWith('/ws') ? baseUrl : `${baseUrl}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', userId }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case 'qr_update':
                        setQrCode(msg.data.deviceId, msg.data.qr);
                        break;

                    case 'device_status':
                        updateDeviceStatus(
                            msg.data.deviceId,
                            msg.data.status,
                            msg.data.phoneNumber
                        );
                        if (msg.data.status === 'CONNECTED') {
                            clearQrCode(msg.data.deviceId);
                        }
                        break;

                    case 'blast_progress':
                        // Handled by blast page if interested
                        window.dispatchEvent(
                            new CustomEvent('blast_progress', { detail: msg.data })
                        );
                        break;
                }
            } catch { }
        };

        ws.onclose = () => {
            // Reconnect after 3s
            setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.CLOSED) {
                    wsRef.current = null;
                }
            }, 3000);
        };

        return () => {
            ws.close();
        };
    }, [userId]);

    return wsRef;
}
