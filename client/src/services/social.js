import api from './api';

export const getMyStats = () => api.get('/social/me/stats');
export const getMyPosts = () => api.get('/social/me/posts');
export const getMyMedia = () => api.get('/social/me/media');
export const getMyFollowers = () => api.get('/social/me/followers');
export const getMyFriends = () => api.get('/social/me/friends');
export const removeFollower = (followerId) => api.delete(`/social/followers/${followerId}`);
