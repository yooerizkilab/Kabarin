'use client';

import { useEffect, useState } from 'react';
import { deviceAPI } from '@/services/api';
import { useDeviceStore } from '@/store/deviceStore';
import toast from 'react-hot-toast';
import QRCodeModal from '@/components/QRCodeModal';

export default function DevicesPage() {
  const { devices, setDevices, removeDevice, addDevice } = useDeviceStore();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [qrDeviceId, setQrDeviceId] = useState<string | null>(null);

  useEffect(() => {
    deviceAPI.list().then((res) => {
      setDevices(res.data.data);
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    if (!newDeviceName.trim()) return toast.error('Enter a device name');
    setConnecting(true);
    try {
      const res = await deviceAPI.connect(newDeviceName.trim());
      const device = res.data.data;
      addDevice(device);
      setQrDeviceId(device.id);
      setNewDeviceName('');
      toast.success('Device created — scan QR code');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to connect device');
    } finally {
      setConnecting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Disconnect and remove this device?')) return;
    try {
      await deviceAPI.delete(id);
      removeDevice(id);
      toast.success('Device removed');
    } catch {
      toast.error('Failed to remove device');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      CONNECTED: 'badge-connected',
      DISCONNECTED: 'badge-disconnected',
      CONNECTING: 'badge-connecting',
      QR_REQUIRED: 'badge-qr',
    };
    return map[status] || 'badge-disconnected';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Devices</h1>
        <p className="text-gray-400 mt-1">Manage your WhatsApp device connections</p>
      </div>

      {/* Add device */}
      <div className="card">
        <h2 className="section-title mb-4">Connect New Device</h2>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Device name (e.g. Marketing Phone)"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <button className="btn-primary" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Device list */}
      <div className="card">
        <h2 className="section-title mb-4">Your Devices</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : devices.length === 0 ? (
          <p className="text-gray-500 text-sm">No devices yet. Connect your first device above.</p>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-xl">
                    📱
                  </div>
                  <div>
                    <p className="font-medium text-white">{d.name}</p>
                    <p className="text-sm text-gray-400">
                      {d.phoneNumber ? `+${d.phoneNumber}` : 'Not linked'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={statusBadge(d.status)}>{d.status.replace('_', ' ')}</span>
                  {(d.status === 'QR_REQUIRED' || d.status === 'CONNECTING') && (
                    <button
                      onClick={() => setQrDeviceId(d.id)}
                      className="btn-secondary text-sm"
                    >
                      Show QR
                    </button>
                  )}
                  <button onClick={() => handleDelete(d.id)} className="btn-danger text-sm">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrDeviceId && (
        <QRCodeModal deviceId={qrDeviceId} onClose={() => setQrDeviceId(null)} />
      )}
    </div>
  );
}
