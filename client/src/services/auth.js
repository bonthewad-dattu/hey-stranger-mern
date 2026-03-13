import api from './api';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getCurrentUser = () => api.get('/auth/me');
export const updateCurrentUser = (data) => api.patch('/auth/me', data);
export const deleteCurrentUser = () => api.delete('/auth/me');
