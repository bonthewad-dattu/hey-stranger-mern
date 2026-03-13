import api from './api';

export const getCommentsForPost = (postId) => api.get(`/posts/${postId}/comments`);
export const addCommentToPost = (postId, data) => api.post(`/posts/${postId}/comments`, data);
