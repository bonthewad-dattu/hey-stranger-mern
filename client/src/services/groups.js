import api from './api';

export const getGroups = () => api.get('/groups');
export const createGroup = (data) => api.post('/groups', data);
export const toggleJoinGroup = (id) => api.post(`/groups/${id}/join`);
