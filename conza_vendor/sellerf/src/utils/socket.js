// conzavf/src/utils/socket.js
import { io } from 'socket.io-client';
import { BASE_URL } from '../services/apiClient';

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  BASE_URL.replace('/api', '');

export const socket = io(SOCKET_URL, { autoConnect: false, transports: ['websocket'] });

export const connectSocket = (sellerId) => {
  if (!socket.connected) socket.connect();
  if (sellerId) socket.emit('join_seller', sellerId);
};

export const disconnectSocket = () => {
  socket.disconnect();
};