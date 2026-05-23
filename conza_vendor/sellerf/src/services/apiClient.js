// conzavf/src/services/apiClient.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Seller backend runs on port 5001
// Change IP to your machine's LAN IP for physical device testing
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.X:5001/api';

const getToken = () => AsyncStorage.getItem('vendor_token');

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

  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

export const api = {
  get:    (endpoint)           => request('GET',    endpoint),
  post:   (endpoint, body)     => request('POST',   endpoint, body),
  put:    (endpoint, body)     => request('PUT',    endpoint, body),
  patch:  (endpoint, body)     => request('PATCH',  endpoint, body),
  delete: (endpoint)           => request('DELETE', endpoint),
};