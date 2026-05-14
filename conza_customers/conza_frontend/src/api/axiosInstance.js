import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://NITHIN.local:5000/api';
// ☝️ Replace with your machine's local IP (e.g. http://192.168.1.5:5000/api)
// In production replace with your hosted domain

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export default api;