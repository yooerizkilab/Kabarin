'use client';

import { useState, useEffect } from 'react';
import { tagAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function TagManager() {
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' });

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const res = await tagAPI.list();
            setTags(res.data.data);
        } catch (err) {
            toast.error('Failed to load tags');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await tagAPI.create(newTag);
            toast.success('Tag created');
            setNewTag({ name: '', color: '#3b82f6' });
            setIsAdding(false);
            loadTags();
        } catch (err) {
            toast.error('Failed to create tag');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await tagAPI.delete(id);
            toast.success('Tag deleted');
            loadTags();
        } catch (err) {
            toast.error('Failed to delete tag');
        }
    };

    if (loading) return <div className="text-gray-500 text-sm italic">Loading tags...</div>;

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h2 className="section-title flex items-center gap-2">
                    <span>🏷️</span> Segments & Tags
                </h2>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-secondary !py-1.5 !text-xs"
                >
                    {isAdding ? 'Cancel' : '+ New Tag'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Tag Name</label>
                            <input 
                                className="input" 
                                value={newTag.name}
                                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                                placeholder="e.g. VIP Customer"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Color</label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="color" 
                                    className="w-10 h-10 bg-transparent cursor-pointer"
                                    value={newTag.color}
                                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                                />
                                <span className="text-sm font-mono text-gray-400 uppercase">{newTag.color}</span>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary w-full !py-2">Save Tag</button>
                </form>
            )}

            <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No tags created yet.</p>
                ) : (
                    tags.map(tag => (
                        <div 
                            key={tag.id}
                            className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-800 bg-gray-800/30 transition-all hover:bg-gray-800"
                        >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                            <span className="text-sm font-medium text-white">{tag.name}</span>
                            <button 
                                onClick={() => handleDelete(tag.id)}
                                className="ml-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
