import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001'; // Express Backend API

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for session cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

// Auth API - function labels for authentication-related endpoints
export const authAPI = {
    whoami: () => api.get('/auth/whoami'),
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (email, password) => api.post('/auth/register', { email, password }),
    logout: () => api.post('/auth/logout'),
    deleteAccount: () => api.post('/user/del-acc')
};

// Notes API - function labels for notes-related endpoints
export const notesAPI = {
    getAll: () => api.get('/user/notes'),
    getByTitle: (title) => api.get(`/user/notes/${encodeURIComponent(title)}`),
    getRecent: () => api.get('/user/notes/recent'),
    create: (title, content) => api.post('/user/notes', { title, content }),
    update: (oldTitle, newTitle, content) => api.patch(`/user/notes/${encodeURIComponent(oldTitle)}`, { newTitle, content }),
    delete: (title) => api.delete(`/user/notes/${encodeURIComponent(title)}`)
};

// Calendar API - function labels for calendar-related endpoints
export const eventsAPI = {
    getAll: () => api.get('/user/events'),
    getUpcoming: () => api.get('/user/events/upcoming'),
    create: (event) => api.post('/user/events', event),
    update: (id, event) => api.patch(`/user/events/${id}`, event),
    delete: (id) => api.delete(`/user/events/${id}`),
    syncTimetable: (email, password, startDate) => 
        api.post('/user/timetable/sync', { email, password, startDate }),
    importICS: (formData) => api.post('/user/events/import-ics', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    exportICS: () => api.get('/user/events/export-ics', { responseType: 'blob' })
};

// Settings API - function labels for settings-related endpoints
export const settingsAPI = {
    get: () => api.get('/user/settings'),
    update: (settings) => api.patch('/user/settings', settings)
};

export default api;