'use client';

import { useEffect, useState } from 'react';
import { deviceAPI, messageAPI, blastAPI, billingAPI } from '@/services/api';
import { useDeviceStore } from '@/store/deviceStore';
import Link from 'next/link';

export default function DashboardPage() {
  const { devices, setDevices } = useDeviceStore();
  const [stats, setStats] = useState({ messages: 0, blastJobs: 0, contacts: 0 });
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [devRes, logRes, blastRes, billingRes] = await Promise.all([
          deviceAPI.list(),
          messageAPI.getLogs({ limit: 1 }),
          blastAPI.list(),
          billingAPI.getMe(),
        ]);
        setDevices(devRes.data.data);
        setStats({
          messages: logRes.data.data.length,
          blastJobs: blastRes.data.data.length,
          contacts: 0,
        });
        setBilling(billingRes.data.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const connected = devices.filter((d) => d.status === 'CONNECTED').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your WhatsApp Gateway</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-2xl">📱</span>
          <div className="stat-value">{connected}</div>
          <div className="stat-label">Active Devices</div>
        </div>
        <div className="stat-card">
          <span className="text-2xl">📞</span>
          <div className="stat-value">{devices.length}</div>
          <div className="stat-label">Total Devices</div>
        </div>
        <div className="stat-card">
          <span className="text-2xl">💬</span>
          <div className="stat-value">{stats.messages}</div>
          <div className="stat-label">Messages Sent</div>
        </div>
        <div className="stat-card">
          <span className="text-2xl">📢</span>
          <div className="stat-value">{stats.blastJobs}</div>
          <div className="stat-label">Blast Campaigns</div>
        </div>
      </div>

      {/* Quota Usage */}
      {billing && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Message Quota Usage</h2>
            <Link href="/billing" className="text-xs text-brand-400 hover:underline">Manage Billing</Link>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Monthly Usage: <span className="text-white font-medium">{billing.messagesSentThisMonth.toLocaleString()} / {(billing.currentPlan?.maxMessagesPerMonth || 100).toLocaleString()}</span></span>
              <span className="text-white font-bold">{Math.round((billing.messagesSentThisMonth / (billing.currentPlan?.maxMessagesPerMonth || 100)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  (billing.messagesSentThisMonth / (billing.currentPlan?.maxMessagesPerMonth || 100)) > 0.9 ? 'bg-red-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min((billing.messagesSentThisMonth / (billing.currentPlan?.maxMessagesPerMonth || 100)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 italic">
              Plan: <span className="text-gray-300 font-medium uppercase">{billing.currentPlan?.name || 'Free Tier'}</span> • Expires: {billing.subscriptionEndDate ? new Date(billing.subscriptionEndDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="card">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Connect Device', href: '/devices', icon: '📱' },
            { label: 'Send Message', href: '/send', icon: '💬' },
            { label: 'Create Blast', href: '/blast', icon: '📢' },
            { label: 'View Logs', href: '/logs', icon: '📋' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-center"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-medium text-gray-300">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Device list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Devices</h2>
          <Link href="/devices" className="text-sm text-brand-400 hover:underline">View all</Link>
        </div>
        {devices.length === 0 ? (
          <p className="text-gray-500 text-sm">No devices connected yet.</p>
        ) : (
          <div className="space-y-2">
            {devices.slice(0, 4).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.phoneNumber || 'Not linked'}</p>
                </div>
                <span className={`badge-${d.status.toLowerCase().replace('_', '-')} text-xs`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
