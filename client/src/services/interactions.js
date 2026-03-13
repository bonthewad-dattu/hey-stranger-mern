import api from './api';

export const likePost = (id) => api.post(`/posts/${id}/like`);
export const getPostStats = (id) => api.get(`/posts/${id}/stats`);
export const repostPost = (id) => api.post(`/posts/${id}/repost`);
export const getPostComments = (id) => api.get(`/posts/${id}/comments`);
export const addPostComment = (id, text) => api.post(`/posts/${id}/comments`, { text });
