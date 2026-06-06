// src/services/apiClient.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://conza-production.up.railway.app/api';

const getToken = () => AsyncStorage.getItem('conza_token');

const request = async (method, endpoint, body = null, isFormData = false) => {
  const token = await getToken();

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
  };

  const config = {
    method,
    headers,
    ...(body && { body: isFormData ? body : JSON.stringify(body) }),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, body) => request('POST', endpoint, body),
  patch: (endpoint, body) => request('PATCH', endpoint, body),
  upload: (endpoint, formData) => request('PATCH', endpoint, formData, true),
};