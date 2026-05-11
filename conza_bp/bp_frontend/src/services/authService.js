// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './apiClient';

const TOKEN_KEY  = 'conza_token';
const WORKER_KEY = 'conza_worker';

// ── Persist helpers ───────────────────────────────────────────────────────
export const saveSession = async (token, worker) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY,  token],
    [WORKER_KEY, JSON.stringify(worker)],
  ]);
};

export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, WORKER_KEY]);
};

export const getStoredToken = () => AsyncStorage.getItem(TOKEN_KEY);

export const getStoredWorker = async () => {
  const raw = await AsyncStorage.getItem(WORKER_KEY);
  return raw ? JSON.parse(raw) : null;
};

// ── Auth API calls ─────────────────────────────────────────────────────────

export const signUp = async (formData) => {
  const data = await api.post('/workers/signup', formData);
  await saveSession(data.token, data.worker);
  return data.worker;
};

export const login = async (identifier, password) => {
  const data = await api.post('/workers/login', { identifier, password });
  await saveSession(data.token, data.worker);
  return data.worker;
};

export const logout = async () => {
  await clearSession();
};

export const getLoggedInUser = async () => {
  const token = await getStoredToken();
  if (!token) return null;
  return getStoredWorker();
};

export const getMe = async () => {
  try {
    const data = await api.get('/workers/me');
    const worker = data.worker;
    const token  = await getStoredToken();
    await saveSession(token, worker);
    return worker;
  } catch {
    return null;
  }
};
