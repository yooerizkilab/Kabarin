'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { billingAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Transaction {
    id: string;
    amount: number;
    status: 'PENDING' | 'PAID' | 'FAILED';
    createdAt: string;
    plan: {
        name: string;
    };
    paymentGatewayUrl: string | null;
}

interface BillingInfo {
    currentPlan: any | null;
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    messagesSentThisMonth: number;
    transactions: Transaction[];
}

export default function BillingPage() {
    const [info, setInfo] = useState<BillingInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const loadBillingInfo = async () => {
        try {
            const res = await billingAPI.getMe();
            setInfo(res.data.data);
        } catch (err) {
            toast.error('Failed to load billing information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBillingInfo();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!info) return null;

    const isActive = info.subscriptionStatus === 'ACTIVE';
    const planName = info.currentPlan?.name || 'Free Tier';
    const quotaUsed = info.messagesSentThisMonth;
    const quotaTotal = info.currentPlan?.maxMessagesPerMonth || 100;
    const progress = Math.min((quotaUsed / quotaTotal) * 100, 100);

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-white mb-8">💳 Billing & Pelanggan</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Current Plan Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Paket Saat Ini</p>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{planName}</h2>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                                isActive ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}>
                                {info.subscriptionStatus}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-800">
                            <div>
                                <p className="text-gray-400 text-sm mb-1 text-uppercase">Berakhir Pada</p>
                                <p className="text-white font-medium">
                                    {info.subscriptionEndDate ? new Date(info.subscriptionEndDate).toLocaleDateString('id-ID', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    }) : 'Tidak Ada'}
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <Link href="/pricing" className="btn-primary w-full md:w-auto text-center">
                                    Upgrade / Perpanjang
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Usage Statistics */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-white mb-6">📊 Pemakaian Kuota Pesan</h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-gray-400 text-sm">Penggunaan Bulan Ini</span>
                                <span className="text-white font-bold">{quotaUsed.toLocaleString()} / {quotaTotal.toLocaleString()}</span>
                            </div>
                            
                            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            
                            <p className="text-xs text-gray-500 italic mt-2">
                                {isActive ? 'Pesan akan direset pada siklus penagihan berikutnya.' : 'Daftarkan paket berbayar untuk mendapatkan kuota lebih besar.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info / FAQ */}
                <div className="space-y-6">
                    <div className="bg-blue-900/10 border border-blue-900/30 rounded-2xl p-6">
                        <h4 className="text-blue-400 font-bold mb-3 flex items-center">
                            <span className="mr-2">💡</span> Info Penagihan
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Penagihan dilakukan setiap 30 hari. Anda akan menerima notifikasi email saat masa aktif mendekati berakhir. 
                            Pastikan kuota pesan mencukupi untuk menjalankan Campaign Blast.
                        </p>
                    </div>
                </div>
            </div>

            {/* Transaction History Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white">Riwayat Transaksi</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Order ID / Tanggal</th>
                                <th className="px-6 py-4 font-medium">Paket</th>
                                <th className="px-6 py-4 font-medium">Jumlah</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-gray-300">
                            {info.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        Belum ada riwayat transaksi.
                                    </td>
                                </tr>
                            ) : (
                                info.transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-800/20">
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white font-mono">{tx.id.substring(0, 8)}...</div>
                                            <div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">{tx.plan.name}</td>
                                        <td className="px-6 py-4">Rp {tx.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                tx.status === 'PAID' ? 'bg-green-900/40 text-green-400 border border-green-800/50' :
                                                tx.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50' :
                                                'bg-red-900/40 text-red-400 border border-red-800/50'
                                            }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tx.status === 'PENDING' && tx.paymentGatewayUrl && (
                                                <a 
                                                    href={tx.paymentGatewayUrl} 
                                                    target="_blank" 
                                                    className="text-xs text-blue-400 hover:underline"
                                                >
                                                    Bayar Sekarang →
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
