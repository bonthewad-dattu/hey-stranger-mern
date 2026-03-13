import api from './api';

export const getPages = () => api.get('/pages');
export const createPage = (data) => api.post('/pages', data);
export const toggleFollowPage = (id) => api.post(`/pages/${id}/follow`);
