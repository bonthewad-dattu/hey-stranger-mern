import api from './api';

export const getOffers = () => api.get('/offers');
export const createOffer = (data) => api.post('/offers', data);
export const toggleClaimOffer = (id) => api.post(`/offers/${id}/claim`);
