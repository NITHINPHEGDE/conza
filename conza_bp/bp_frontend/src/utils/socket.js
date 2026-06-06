import { io } from 'socket.io-client';

// ✅ Must match your Render URL (no /api suffix for socket)
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || 'https://conza-production.up.railway.app';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    console.log('🔌 BP Socket connecting to:', SOCKET_URL);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};