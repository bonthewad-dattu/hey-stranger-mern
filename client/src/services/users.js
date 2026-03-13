import api from './api';

export const searchUsers = (q) => api.get('/users/search', { params: { q } });
export const getUserByUsername = (username) => api.get(`/users/${username}`);
export const getUserPostsByUsername = (username) => api.get(`/posts/user/${username}`);
