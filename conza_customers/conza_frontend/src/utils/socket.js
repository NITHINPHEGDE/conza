import { io } from 'socket.io-client';

// Use HTTPS — Railway does not expose raw port 5000 publicly
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  'https://conza-production-f2c8.up.railway.app';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};