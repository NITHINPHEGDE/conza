// conzavf/src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL }  from './apiClient';

export const registerSeller = async (payload) => {
  const res  = await fetch(`${BASE_URL}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  await AsyncStorage.setItem('vendor_token', data.token);
  return data.seller;
};

export const loginSeller = async (phone, password) => {
  const res  = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  await AsyncStorage.setItem('vendor_token', data.token);
  return data.seller;
};

export const getLoggedInSeller = async () => {
  const token = await AsyncStorage.getItem('vendor_token');
  if (!token) return null;
  try {
    const res  = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.success ? data.seller : null;
  } catch (_) {
    return null;
  }
};

export const logoutSeller = async () => {
  await AsyncStorage.removeItem('vendor_token');
};