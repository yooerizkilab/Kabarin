'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    messagesSentThisMonth: number;
    subscriptionPlan: {
        name: string;
    } | null;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form states for override
    const [formData, setFormData] = useState({
        subscriptionPlanId: '',
        subscriptionStatus: '',
        subscriptionEndDate: '',
        messagesSentThisMonth: ''
    });

    const loadData = async () => {
        try {
            const [usersRes, plansRes] = await Promise.all([
                adminAPI.listUsers(),
                adminAPI.getPlans()
            ]);
            setUsers(usersRes.data.data);
            setPlans(plansRes.data.data);
        } catch (err) {
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            subscriptionPlanId: plans.find(p => p.name === user.subscriptionPlan?.name)?.id || '',
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEndDate: user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toISOString().split('T')[0] : '',
            messagesSentThisMonth: user.messagesSentThisMonth.toString()
        });
        setIsModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            await adminAPI.updateUserSubscription(selectedUser.id, formData);
            toast.success('User subscription updated');
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            toast.error('Failed to update user');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-8">👤 Manage Users & Quotas</h1>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Status & Plan</th>
                            <th className="px-6 py-4">Usage</th>
                            <th className="px-6 py-4">Expiry</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-800/20">
                                <td className="px-6 py-4">
                                    <div className="text-sm text-white font-medium">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                    <div className="text-[10px] mt-1 text-gray-600 font-mono">{user.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="uppercase text-xs font-bold text-brand-500">{user.subscriptionPlan?.name || 'FREE'}</div>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        user.subscriptionStatus === 'ACTIVE' ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-gray-800 text-gray-500'
                                    }`}>
                                        {user.subscriptionStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-white">{user.messagesSentThisMonth.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">messages this month</div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleOpenEdit(user)}
                                        className="text-brand-500 hover:text-brand-400 text-sm font-medium"
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-white">Manage Subscription</h2>
                            <p className="text-sm text-gray-400">{selectedUser.name} ({selectedUser.email})</p>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Subscription Plan</label>
                                <select 
                                    className="input-field"
                                    value={formData.subscriptionPlanId}
                                    onChange={(e) => setFormData({...formData, subscriptionPlanId: e.target.value})}
                                >
                                    <option value="">Select Plan</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Status</label>
                                <select 
                                    className="input-field"
                                    value={formData.subscriptionStatus}
                                    onChange={(e) => setFormData({...formData, subscriptionStatus: e.target.value})}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="EXPIRED">EXPIRED</option>
                                    <option value="CANCELED">CANCELED</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Expiry Date</label>
                                <input 
                                    type="date"
                                    className="input-field"
                                    value={formData.subscriptionEndDate}
                                    onChange={(e) => setFormData({...formData, subscriptionEndDate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Usage Counter (Reset)</label>
                                <input 
                                    type="number"
                                    className="input-field"
                                    value={formData.messagesSentThisMonth}
                                    onChange={(e) => setFormData({...formData, messagesSentThisMonth: e.target.value})}
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary">Update User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
