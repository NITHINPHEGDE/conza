import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.247.177.155:5005';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    console.log('🔌 BP Socket attempting connection to:', SOCKET_URL);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('🔌 BP Socket disconnected');
  }
};
