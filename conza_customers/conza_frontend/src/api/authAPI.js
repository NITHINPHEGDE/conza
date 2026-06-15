import api from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  signup: async (data) => {
    const res = await api.post('/auth/signup', data);
    if (res.data.token) await AsyncStorage.setItem('authToken', res.data.token);
    return res.data;
  },

  login: async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password });
    if (res.data.token) await AsyncStorage.setItem('authToken', res.data.token);
    return res.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  updateLocation: async ({ latitude, longitude, locationText }) => {
    const res = await api.put('/auth/update-location', { latitude, longitude, locationText });
    return res.data;
  },

  updateProfile: async (payload) => {
    const res = await api.put('/auth/update-profile', payload);
    return res.data;
  },

  reverseGeocode: async (lat, lng) => {
    const res = await api.get(`/auth/reverse-geocode?lat=${lat}&lng=${lng}`);
    return res.data;
  },

  getToken: () => AsyncStorage.getItem('authToken'),

  // ── Saved Addresses ──────────────────────────────────────────────────────
  getSavedAddresses: async () => {
    const res = await api.get('/auth/addresses');
    return res.data;
  },

  addSavedAddress: async (fields) => {
    const res = await api.post('/auth/addresses', fields);
    return res.data;
  },

  updateSavedAddress: async (addressId, fields) => {
    const res = await api.put(`/auth/addresses/${addressId}`, fields);
    return res.data;
  },

  deleteSavedAddress: async (addressId) => {
    const res = await api.delete(`/auth/addresses/${addressId}`);
    return res.data;
  },
};