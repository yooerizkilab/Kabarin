'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { autoResponderAPI, deviceAPI } from '@/services/api';

interface Device {
  id: string;
  name: string;
  phoneNumber: string | null;
  status: string;
}

interface AutoResponder {
  id: string;
  deviceId: string;
  name: string;
  isActive: boolean;
  aiProvider: string | null;
  aiModel: string | null;
  device: Device;
  rules: { id: string }[];
}

const AI_PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
};

export default function AutoResponderPage() {
  const [autoResponders, setAutoResponders] = useState<AutoResponder[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ deviceId: '', name: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [arRes, devRes] = await Promise.all([
        autoResponderAPI.list(),
        deviceAPI.list(),
      ]);
      setAutoResponders(arRes.data.data);
      setDevices(devRes.data.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.deviceId || !form.name.trim()) return;
    setCreating(true);
    try {
      await autoResponderAPI.create({ deviceId: form.deviceId, name: form.name });
      setShowCreate(false);
      setForm({ deviceId: '', name: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create auto-responder');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (ar: AutoResponder) => {
    try {
      await autoResponderAPI.update(ar.id, { isActive: !ar.isActive });
      load();
    } catch {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this auto-responder?')) return;
    try {
      await autoResponderAPI.delete(id);
      load();
    } catch {
      setError('Failed to delete');
    }
  };

  // Devices without an auto-responder already
  const availableDevices = devices.filter(
    (d) => !autoResponders.some((ar) => ar.deviceId === d.id)
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🤖 Auto-Responder</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Balas pesan masuk secara otomatis dengan keyword rules atau AI
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary w-full sm:w-auto justify-center"
          disabled={availableDevices.length === 0}
        >
          + Buat Auto-Responder
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
          <button className="ml-3 text-red-400 underline" onClick={() => setError('')}>Tutup</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Buat Auto-Responder</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Device</label>
                <select
                  value={form.deviceId}
                  onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">-- Pilih Device --</option>
                  {availableDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.phoneNumber ? `(${d.phoneNumber})` : ''} — {d.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nama</label>
                <input
                  className="input w-full"
                  placeholder="Misal: CS Bot Toko A"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="btn-primary flex-1"
                onClick={handleCreate}
                disabled={creating || !form.deviceId || !form.name.trim()}
              >
                {creating ? 'Membuat...' : 'Buat'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Memuat...</div>
      ) : autoResponders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl">
          <div className="text-5xl mb-3">🤖</div>
          <p className="text-gray-400 font-medium">Belum ada Auto-Responder</p>
          <p className="text-gray-600 text-sm mt-1">
            Klik &quot;Buat Auto-Responder&quot; untuk memulai
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {autoResponders.map((ar) => (
            <div
              key={ar.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Status dot */}
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${ar.isActive ? 'bg-green-400 shadow-lg shadow-green-400/40' : 'bg-gray-600'}`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{ar.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-xs text-gray-500">
                    <span className="flex items-center gap-1">📱 {ar.device?.name || ar.deviceId}</span>
                    {ar.device?.phoneNumber && <span>{ar.device.phoneNumber}</span>}
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${ar.device?.status === 'CONNECTED' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                      {ar.device?.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] sm:text-xs text-gray-500">
                    <span>📋 {ar.rules.length} keyword rule{ar.rules.length !== 1 ? 's' : ''}</span>
                    {ar.aiProvider && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-900/50 text-brand-400 border border-brand-800 whitespace-nowrap">
                        ✨ AI: {AI_PROVIDER_LABELS[ar.aiProvider] || ar.aiProvider}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0 border-t border-gray-800 sm:border-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/auto-responder/${ar.id}`}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    Kelola →
                  </Link>
                  <button
                    onClick={() => handleDelete(ar.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
                  >
                    Hapus
                  </button>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(ar)}
                  title={ar.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${ar.isActive ? 'bg-brand-600' : 'bg-gray-700'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${ar.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
