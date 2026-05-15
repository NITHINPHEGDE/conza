// src/services/apiClient.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.247.177.155:5005/api';
// Android emulator: 10.0.2.2 → host machine localhost
// iOS simulator / physical device: use your machine's local IP e.g. http://192.168.1.X:5000/api

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
  const data     = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  get:    (endpoint)              => request('GET',    endpoint),
  post:   (endpoint, body)        => request('POST',   endpoint, body),
  patch:  (endpoint, body)        => request('PATCH',  endpoint, body),
  upload: (endpoint, formData)    => request('PATCH',  endpoint, formData, true),
};
