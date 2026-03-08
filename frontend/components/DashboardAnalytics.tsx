'use client';

import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';

export default function DashboardAnalytics() {
    const [summary, setSummary] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [blasts, setBlasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [sumRes, chartRes, blastRes] = await Promise.all([
                    analyticsAPI.getSummary(),
                    analyticsAPI.getChartData(),
                    analyticsAPI.getBlastStats()
                ]);
                setSummary(sumRes.data.data);
                setChartData(chartRes.data.data);
                setBlasts(blastRes.data.data);
            } catch (err) {
                console.error('Failed to load analytics', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="text-gray-500 text-sm italic">Loading analytics...</div>;

    return (
        <div className="space-y-6">
            {/* Detailed Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card !p-5 flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Last 30 Days Sent</p>
                        <h3 className="text-3xl font-bold text-white">{summary?.last30Days.sent + summary?.last30Days.delivered + summary?.last30Days.read || 0}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold">
                            {summary?.successRate}% Success
                        </span>
                        <span className="text-gray-500">Delivery Accuracy</span>
                    </div>
                </div>

                <div className="card !p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Failure Rate</p>
                    <h3 className="text-3xl font-bold text-red-500">{summary?.last30Days.failed || 0}</h3>
                    <div className="mt-4 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className="bg-red-500 h-full transition-all duration-500" 
                            style={{ width: `${summary?.last30Days.failed > 0 ? (summary.last30Days.failed / (summary.last30Days.sent + summary.last30Days.failed || 1)) * 100 : 0}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">Based on last 30 days activity</p>
                </div>

                <div className="card !p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Monthly Quota used</p>
                    <h3 className="text-3xl font-bold text-brand-500">{summary?.totalMonth || 0}</h3>
                    <p className="text-xs text-brand-600 mt-2 font-medium">Resetting in start of next month</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h2 className="section-title mb-6 flex items-center gap-2">
                        <span>📈</span> Message Volume (Last 7 Days)
                    </h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#9ca3af" 
                                    fontSize={10} 
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                                    }}
                                />
                                <YAxis stroke="#9ca3af" fontSize={10} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="sent" stroke="#10b981" fillOpacity={1} fill="url(#colorSent)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h2 className="section-title mb-6 flex items-center gap-2">
                        <span>📊</span> Success vs Failure Distribution
                    </h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#9ca3af" 
                                    fontSize={10}
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                                    }}
                                />
                                <YAxis stroke="#9ca3af" fontSize={10} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Bar dataKey="sent" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Blast Performance */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="section-title flex items-center gap-2">
                        <span>🚀</span> Recent Blast Performance
                    </h2>
                    <Link href="/blast" className="text-xs text-brand-400 hover:underline">View All Blast</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                                <th className="px-2 py-3">Campaign Name</th>
                                <th className="px-2 py-3">Status</th>
                                <th className="px-2 py-3">Success Rate</th>
                                <th className="px-2 py-3">Progress</th>
                                <th className="px-2 py-3 text-right">Failure</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {blasts.map((job) => (
                                <tr key={job.id} className="text-sm">
                                    <td className="px-2 py-4">
                                        <p className="font-medium text-white">{job.name}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(job.createdAt).toLocaleString()}</p>
                                    </td>
                                    <td className="px-2 py-4">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            job.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                                            job.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-500 animate-pulse' : 
                                            'bg-gray-500/10 text-gray-500'
                                        }`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 font-bold text-white">
                                        {job.total > 0 ? Math.round((job.sent / job.total) * 100) : 0}%
                                    </td>
                                    <td className="px-2 py-4">
                                        <div className="flex items-center gap-2 min-w-[100px]">
                                            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-brand-500 h-full transition-all duration-1000" 
                                                    style={{ width: `${job.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-gray-500">{job.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 text-right text-red-500 font-medium">
                                        {job.failed}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Internal Link helper for the component
function Link({ href, children, className }: any) {
    return (
        <a href={href} className={className}>
            {children}
        </a>
    );
}
