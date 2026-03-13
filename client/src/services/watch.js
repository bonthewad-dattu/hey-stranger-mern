import api from './api';

export const getVideos = () => api.get('/watch');
export const createVideo = (data) => api.post('/watch', data);
export const toggleLikeVideo = (id) => api.post(`/watch/${id}/like`);
