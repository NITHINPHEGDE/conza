import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use HTTPS — Railway does not expose raw port 5000 publicly
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  'https://conza-production-b541.up.railway.app';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

socket.on('connect_error', (err) => {
  if (err && err.message) {
    console.warn('[Customer Socket] Connection error:', err.message);
  }
});

export const connectSocket = async (tokenOverride) => {
  try {
    const token = tokenOverride || (await AsyncStorage.getItem('authToken'));
    socket.auth = token ? { token } : {};

    if (!socket.connected) {
      socket.connect();
    } else if (tokenOverride) {
      // Reconnect with new credentials if token was explicitly provided
      socket.disconnect().connect();
    }
  } catch (err) {
    console.warn('[Customer Socket] connectSocket error:', err.message);
    if (!socket.connected) socket.connect();
  }
};

export const disconnectSocket = () => {
  socket.auth = {};
  if (socket.connected) socket.disconnect();
};