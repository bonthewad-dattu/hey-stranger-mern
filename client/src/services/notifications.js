import api from './api';

export const getNotificationSummary = () => api.get('/notifications/summary');
export const getNotificationHistory = () => api.get('/notifications/history');
export const markNotificationsRead = () => api.post('/notifications/mark-read');
