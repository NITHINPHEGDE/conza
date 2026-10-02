// conzavf/src/utils/socket.js
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/apiClient';

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  BASE_URL.replace('/api', '');

export const socket = io(SOCKET_URL, { autoConnect: false, transports: ['websocket'] });

socket.on('connect_error', (err) => {
  if (err && err.message) {
    console.warn('🏪 [Vendor Socket] Connection error:', err.message);
  }
});

export const connectSocket = async (sellerId, tokenOverride) => {
  try {
    const token = tokenOverride || (await AsyncStorage.getItem('vendor_token'));
    if (!token) {
      console.warn('🏪 [Vendor Socket] No auth token found; skipping socket connection');
      return;
    }
    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    } else if (tokenOverride) {
      socket.disconnect().connect();
    }

    if (sellerId) socket.emit('join_seller', sellerId);
  } catch (err) {
    console.warn('🏪 [Vendor Socket] connectSocket error:', err.message);
  }
};

export const disconnectSocket = () => {
  socket.auth = {};
  socket.disconnect();
};