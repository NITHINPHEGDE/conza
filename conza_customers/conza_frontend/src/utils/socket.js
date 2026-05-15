import { io } from 'socket.io-client';

const SOCKET_URL = 'http://NITHIN.local:5000'; // Match your backend port

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Connect manually when app starts
  transports: ['websocket'], // Faster and more reliable in React Native
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
