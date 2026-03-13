import api from './api';

export const getBlogs = () => api.get('/blogs');
export const createBlog = (data) => api.post('/blogs', data);
export const toggleLikeBlog = (id) => api.post(`/blogs/${id}/like`);
