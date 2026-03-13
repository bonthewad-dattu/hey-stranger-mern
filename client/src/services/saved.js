import api from './api';

export const getSavedPosts = () => api.get('/saved');
export const savePost = (postId) => api.post(`/saved/${postId}`);
export const unsavePost = (postId) => api.delete(`/saved/${postId}`);
