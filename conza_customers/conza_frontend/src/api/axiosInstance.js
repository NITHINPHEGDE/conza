import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://conza-production-f2c8.up.railway.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const code = err.response?.data?.code;
    if (code === 'SUSPENDED') {
      // Lazy require to avoid circular import (useAppStore imports this file)
      try {
        const useAppStore = require('../store/useAppStore').default;
        const current = useAppStore.getState().userProfile;
        if (current && current.status !== 'suspended') {
          useAppStore.getState().setUserProfile({ ...current, status: 'suspended' });
        }
      } catch (_) {}
    }
    const msg = err.response?.data?.message || err.message || 'Network error';
    // Preserve the original response/status on the rejected error — callers
    // like fetchActiveBooking rely on err.response.status (e.g. 404/410) to
    // detect stale/deleted resources and clean up local state. Rejecting
    // with a bare `new Error(msg)` stripped this, so 404s never matched and
    // stale IDs (e.g. activeBookingId) were never cleared, causing repeated
    // failing requests on every app init.
    const wrappedErr = new Error(msg);
    wrappedErr.response = err.response;
    wrappedErr.status = err.response?.status;
    wrappedErr.code = code;
    return Promise.reject(wrappedErr);
  }
);

export default api;