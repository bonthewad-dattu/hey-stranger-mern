import api from './api';

export const getConversations = () => api.get('/messages/conversations');
export const getMessagesWith = (userId) => api.get(`/messages/with/${userId}`);
export const sendMessage = (toUserId, text) => api.post('/messages', { toUserId, text });
