'use client';

import { useEffect, useState } from 'react';
import { messageAPI, deviceAPI } from '@/services/api';
import { useDeviceStore } from '@/store/deviceStore';
import toast from 'react-hot-toast';
import MediaSelector from '@/components/MediaSelector';

export default function SendPage() {
  const { devices, setDevices } = useDeviceStore();
  const [form, setForm] = useState({ deviceId: '', to: '', content: '', type: 'TEXT', mediaUrl: '', scheduledAt: '' });
  const [loading, setLoading] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [useScheduling, setUseScheduling] = useState(false);

  useEffect(() => {
    deviceAPI.list().then((r) => setDevices(r.data.data));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!useScheduling) {
          delete (payload as any).scheduledAt;
      }
      await messageAPI.send(payload);
      toast.success(useScheduling ? 'Message scheduled successfully' : 'Message sent successfully');
      setForm((f) => ({ ...f, to: '', content: '', mediaUrl: '', scheduledAt: '' }));
      setUseScheduling(false);
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
            <div className="flex gap-2">
                <input
                    className="input"
                    placeholder="https://..."
                    value={form.mediaUrl}
                    onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                />
                <button 
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="btn-secondary !text-xs whitespace-nowrap"
                >
                    📁 Library
                </button>
            </div>
          </div>
        )}

        {showMediaSelector && (
            <MediaSelector 
                onSelect={(url) => {
                    setForm({ ...form, mediaUrl: url });
                    setShowMediaSelector(false);
                }}
                onClose={() => setShowMediaSelector(false)}
            />
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

        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🕒</span>
                    <span className="text-sm font-medium text-white">Schedule for later</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={useScheduling}
                        onChange={(e) => setUseScheduling(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
            </div>

            {useScheduling && (
                <div className="pt-2 border-t border-gray-700/50">
                    <label className="label !text-xs">Scheduled Time</label>
                    <input 
                        className="input"
                        type="datetime-local"
                        value={form.scheduledAt}
                        onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                        required={useScheduling}
                        min={new Date().toISOString().slice(0, 16)}
                    />
                </div>
            )}
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? (useScheduling ? 'Scheduling...' : 'Sending...') : (useScheduling ? '🕒 Schedule Message' : '💬 Send Message')}
        </button>
      </form>
    </div>
  );
}
