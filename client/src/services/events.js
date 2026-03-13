import api from './api';

export const getEvents = () => api.get('/events');
export const createEvent = (data) => api.post('/events', data);
export const toggleGoingEvent = (id) => api.post(`/events/${id}/going`);
