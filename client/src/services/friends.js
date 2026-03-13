import api from './api';

export const getFriendSuggestions = () => api.get('/friends/suggestions');
export const getIncomingRequests = () => api.get('/friends/requests');
export const sendFriendRequest = (toUserId) => api.post('/friends/requests', { toUserId });
export const acceptFriendRequest = (id) => api.post(`/friends/requests/${id}/accept`);
export const declineFriendRequest = (id) => api.post(`/friends/requests/${id}/decline`);
export const unfriend = (friendId) => api.delete(`/friends/${friendId}`);
