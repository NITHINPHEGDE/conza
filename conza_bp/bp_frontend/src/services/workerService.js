// src/services/workerService.js
import { api } from './apiClient';

export const toggleOnlineAPI = () => api.patch('/workers/toggle-online');

export const updateLocationAPI = (latitude, longitude) =>
  api.patch('/workers/location', { latitude, longitude });

export const updateProfileImageAPI = async (imageUri) => {
  const filename = imageUri.split('/').pop();
  const match    = /\.(\w+)$/.exec(filename);
  const type     = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('image', { uri: imageUri, name: filename, type });

  return api.upload('/workers/profile-image', formData);
};
