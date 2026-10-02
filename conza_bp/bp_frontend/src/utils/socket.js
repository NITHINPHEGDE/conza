import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Must match your Render URL (no /api suffix for socket)
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || 'https://conza-production-9d11.up.railway.app';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

// Dynamically provide fresh token from storage on every connect/reconnect attempt
socket.auth = (cb) => {
  AsyncStorage.getItem('conza_token')
    .then((token) => cb(token ? { token } : {}))
    .catch(() => cb({}));
};

socket.on('connect_error', (err) => {
  if (err && err.message) {
    console.warn('🔌 [BP Socket] Connection error:', err.message);
  }
});

export const connectSocket = async (tokenOverride) => {
  try {
    const token = tokenOverride || (await AsyncStorage.getItem('conza_token'));
    if (!token) {
      console.warn('🔌 [BP Socket] No auth token found; skipping socket connection');
      return;
    }
    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
      console.log('🔌 BP Socket connecting to:', SOCKET_URL);
    } else if (tokenOverride) {
      socket.disconnect().connect();
    }
  } catch (err) {
    console.warn('🔌 [BP Socket] connectSocket error:', err.message);
  }
};

export const disconnectSocket = () => {
  socket.auth = {};
  if (socket.connected) {
    socket.disconnect();
  }
};