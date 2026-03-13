import api from './api';

export const getMyMemories = () => api.get('/memories/me');
