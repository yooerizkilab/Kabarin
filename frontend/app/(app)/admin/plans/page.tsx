'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Plan {
    id: string;
    name: string;
    price: number;
    maxDevices: number;
    maxMessagesPerMonth: number;
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        maxDevices: '',
        maxMessagesPerMonth: ''
    });

    const loadPlans = async () => {
        try {
            const res = await adminAPI.getPlans();
            setPlans(res.data.data);
        } catch (err) {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await adminAPI.updatePlan(editingPlan.id, formData);
                toast.success('Plan updated successfully');
            } else {
                await adminAPI.createPlan(formData);
                toast.success('Plan created successfully');
            }
            setIsModalOpen(false);
            setEditingPlan(null);
            setFormData({ name: '', price: '', maxDevices: '', maxMessagesPerMonth: '' });
            loadPlans();
        } catch (err) {
            toast.error('Operation failed');
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price: plan.price.toString(),
            maxDevices: plan.maxDevices.toString(),
            maxMessagesPerMonth: plan.maxMessagesPerMonth.toString()
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await adminAPI.deletePlan(id);
            toast.success('Plan deleted');
            loadPlans();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading plans...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">💎 Manage Subscription Plans</h1>
                <button 
                    onClick={() => { setEditingPlan(null); setFormData({ name: '', price: '', maxDevices: '', maxMessagesPerMonth: '' }); setIsModalOpen(true); }}
                    className="btn-primary"
                >
                    + Create New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white uppercase">{plan.name}</h3>
                            <span className="text-brand-500 font-bold">Rp {plan.price.toLocaleString()}</span>
                        </div>
                        <ul className="space-y-2 mb-6 text-sm text-gray-400">
                            <li>📱 Max Devices: <span className="text-white font-medium">{plan.maxDevices}</span></li>
                            <li>📢 Max Messages: <span className="text-white font-medium">{plan.maxMessagesPerMonth.toLocaleString()}</span></li>
                        </ul>
                        <div className="flex gap-3">
                            <button onClick={() => handleEdit(plan)} className="flex-1 btn-secondary text-xs py-2">Edit</button>
                            <button onClick={() => handleDelete(plan.id)} className="btn-outline border-red-900/50 text-red-500 text-xs py-2 px-3">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Plan Name</label>
                                <input 
                                    type="text" required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. PROFESSIONAL"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Price (IDR)</label>
                                <input 
                                    type="number" required
                                    className="input-field"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Max Devices</label>
                                    <input 
                                        type="number" required
                                        className="input-field"
                                        value={formData.maxDevices}
                                        onChange={(e) => setFormData({...formData, maxDevices: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Max Messages/Mo</label>
                                    <input 
                                        type="number" required
                                        className="input-field"
                                        value={formData.maxMessagesPerMonth}
                                        onChange={(e) => setFormData({...formData, maxMessagesPerMonth: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary">Save Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
