import api from './api';

export const createPost = (data) => api.post('/posts', data);
export const getFeedPosts = () => api.get('/posts');
export const getMyPosts = () => api.get('/social/me/posts');
export const getMyMedia = () => api.get('/social/me/media');
