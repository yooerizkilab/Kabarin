'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';

interface Props {
  deviceId: string;
  onClose: () => void;
}

export default function QRCodeModal({ deviceId, onClose }: Props) {
  const { qrCodes, devices } = useDeviceStore();
  const qr = qrCodes[deviceId];
  const device = devices.find((d) => d.id === deviceId);

  useEffect(() => {
    // Auto-close when connected
    if (device?.status === 'CONNECTED') {
      onClose();
    }
  }, [device?.status]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Open WhatsApp → Settings → Linked Devices → Link a Device
        </p>

        <div className="flex items-center justify-center bg-white rounded-xl p-4 mb-4">
          {qr ? (
            <QRCodeSVG value={qr} size={220} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 text-sm">Generating QR code…</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              device?.status === 'CONNECTED'
                ? 'bg-brand-400'
                : device?.status === 'QR_REQUIRED'
                ? 'bg-blue-400'
                : 'bg-yellow-400'
            }`}
          />
          <span className="text-gray-400">
            Status: {device?.status?.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
