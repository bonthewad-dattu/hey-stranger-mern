import api from './api';

export const getMarketplaceItems = () => api.get('/marketplace');
export const createMarketplaceItem = (data) => api.post('/marketplace', data);
export const toggleInterestedItem = (id) => api.post(`/marketplace/${id}/interested`);
