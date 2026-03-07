'use client';

import { useEffect, useState } from 'react';
import { messageAPI, deviceAPI } from '@/services/api';
import { useDeviceStore } from '@/store/deviceStore';
import toast from 'react-hot-toast';

export default function SendPage() {
  const { devices, setDevices } = useDeviceStore();
  const [form, setForm] = useState({ deviceId: '', to: '', content: '', type: 'TEXT', mediaUrl: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    deviceAPI.list().then((r) => setDevices(r.data.data));
  }, []);

  // Render all devices to prevent UI flickering on temporary disconnects

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await messageAPI.send(form);
      toast.success('Message sent successfully');
      setForm((f) => ({ ...f, to: '', content: '', mediaUrl: '' }));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="page-title">Send Message</h1>
        <p className="text-gray-400 mt-1">Send a single WhatsApp message immediately</p>
      </div>

      <form onSubmit={handleSend} className="card space-y-4">
        <div>
          <label className="label">Device</label>
          <select
            className="input"
            value={form.deviceId}
            onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            required
          >
            <option value="">Select a device...</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id} disabled={d.status === 'QR_REQUIRED'}>
                {d.name} {d.phoneNumber ? `(+${d.phoneNumber})` : ''} {d.status !== 'CONNECTED' ? `(${d.status.replace('_', ' ')})` : ''}
              </option>
            ))}
          </select>
          {devices.length === 0 && (
            <p className="text-xs text-yellow-400 mt-1">No devices found. Connect a device first.</p>
          )}
        </div>

        <div>
          <label className="label">Message Type</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="TEXT">Text</option>
            <option value="IMAGE">Image</option>
            <option value="DOCUMENT">Document</option>
          </select>
        </div>

        <div>
          <label className="label">To (Phone Number)</label>
          <input
            className="input"
            placeholder="e.g. 628123456789"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Include country code, no + or spaces (e.g. 628123456789)</p>
        </div>

        {form.type !== 'TEXT' && (
          <div>
            <label className="label">Media URL</label>
            <input
              className="input"
              placeholder="https://..."
              value={form.mediaUrl}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="label">Message</label>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Type your message..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? 'Sending…' : '💬 Send Message'}
        </button>
      </form>
    </div>
  );
}
