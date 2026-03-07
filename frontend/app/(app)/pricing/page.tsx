'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { billingAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Plan {
    id: string;
    name: string;
    price: number;
    maxDevices: number;
    maxMessagesPerMonth: number;
    features: any;
}

export default function PricingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const res = await billingAPI.getPlans();
                setPlans(res.data.data);
            } catch (err) {
                toast.error('Failed to load subscription plans');
            } finally {
                setLoading(false);
            }
        };
        loadPlans();
    }, []);

    const handleSubscribe = async (plan: Plan) => {
        setCheckingOut(plan.id);
        try {
            const res = await billingAPI.checkout(plan.id);
            
            if (res.data.isFree) {
                toast.success('Free plan activated successfully!');
                router.push('/dashboard');
                return;
            }

            const { token } = res.data;
            
            // @ts-ignore
            if (window.snap) {
                // @ts-ignore
                window.snap.pay(token, {
                    onSuccess: (result: any) => {
                        toast.success('Payment successful!');
                        router.push('/billing');
                    },
                    onPending: (result: any) => {
                        toast.success('Payment pending, please complete it.');
                        router.push('/billing');
                    },
                    onError: (result: any) => {
                        toast.error('Payment failed!');
                    },
                    onClose: () => {
                        toast.error('Payment popup closed.');
                    }
                });
            } else {
                window.location.href = res.data.redirect_url;
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to initialize checkout');
        } finally {
            setCheckingOut(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-white mb-4">Pilih Paket Langganan</h1>
                <p className="text-xl text-gray-400">Tingkatkan efisiensi bisnis Anda dengan fitur gateway WhatsApp yang powerfull.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div 
                        key={plan.id} 
                        className={`bg-gray-900 border ${plan.name.toLowerCase().includes('pro') ? 'border-blue-500 shadow-blue-900/20' : 'border-gray-800'} rounded-2xl p-8 flex flex-col hover:border-blue-400 transition-all shadow-xl`}
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                        <div className="mb-6">
                            <span className="text-4xl font-extrabold text-white">Rp {plan.price.toLocaleString()}</span>
                            <span className="text-gray-400 text-sm ml-1">/ bulan</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-center text-gray-300">
                                <span className="text-green-500 mr-2">✓</span> {plan.maxDevices} Device WhatsApp
                            </li>
                            <li className="flex items-center text-gray-300">
                                <span className="text-green-500 mr-2">✓</span> {plan.maxMessagesPerMonth.toLocaleString()} Pesan / Bulan
                            </li>
                            {plan.features && typeof plan.features === 'object' && Object.entries(plan.features).map(([key, feature]: [string, any]) => (
                                <li key={key} className="flex items-center text-gray-300">
                                    <span className="text-green-500 mr-2">✓</span> {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(plan)}
                            disabled={checkingOut === plan.id}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                                plan.name.toLowerCase().includes('pro') 
                                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                            }`}
                        >
                            {checkingOut === plan.id ? 'Memproses...' : 'Pilih Paket'}
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="mt-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Butuh Paket Custom?</h3>
                <p className="text-gray-400 mb-6">Kami melayani solusi kustom untuk enterprise dengan kebutuhan volume pesan yang sangat besar.</p>
                <a href="https://wa.me/yournumber" className="text-blue-400 font-bold hover:underline">Hubungi Tim Sales →</a>
            </div>
        </div>
    );
}
