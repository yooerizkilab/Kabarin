import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('wa_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('wa_token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
};

// ── Devices ───────────────────────────────────────────────
export const deviceAPI = {
    list: () => api.get('/devices'),
    connect: (name: string) => api.post('/devices/connect', { name }),
    delete: (id: string) => api.delete(`/devices/${id}`),
    getStatus: (id: string) => api.get(`/devices/${id}/status`),
};

// ── Messages ──────────────────────────────────────────────
export const messageAPI = {
    send: (data: { deviceId: string; to: string; content: string; type?: string; mediaUrl?: string }) =>
        api.post('/messages/send', data),
    getLogs: (params?: { deviceId?: string; status?: string; limit?: number; offset?: number }) =>
        api.get('/messages/logs', { params }),
};

// ── Blast ─────────────────────────────────────────────────
export const blastAPI = {
    create: (data: {
        deviceId: string;
        name: string;
        message: string;
        groupId?: string;
        templateId?: string;
        scheduledAt?: string;
    }) => api.post('/messages/blast', data),
    list: () => api.get('/messages/blast'),
    getJob: (id: string) => api.get(`/messages/blast/${id}`),
};

// ── Templates ─────────────────────────────────────────────
export const templateAPI = {
    list: () => api.get('/templates'),
    create: (data: { name: string; content: string; variables?: string[] }) =>
        api.post('/templates', data),
    update: (id: string, data: Partial<{ name: string; content: string; variables: string[] }>) =>
        api.put(`/templates/${id}`, data),
    delete: (id: string) => api.delete(`/templates/${id}`),
};

// ── Contacts ──────────────────────────────────────────────
export const contactAPI = {
    list: (groupId?: string) => api.get('/contacts', { params: { groupId } }),
    create: (data: { name: string; phone: string; email?: string; groupId?: string }) =>
        api.post('/contacts', data),
    update: (id: string, data: object) => api.put(`/contacts/${id}`, data),
    delete: (id: string) => api.delete(`/contacts/${id}`),
    importCsv: (file: File, groupId?: string) => {
        const form = new FormData();
        form.append('file', file);
        return api.post('/contacts/import', form, {
            params: { groupId },
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    listGroups: () => api.get('/contacts/groups'),
    createGroup: (name: string) => api.post('/contacts/groups', { name }),
};
