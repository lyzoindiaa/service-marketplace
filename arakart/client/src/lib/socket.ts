import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const accessToken = useAuthStore.getState().accessToken;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    socket = io(socketUrl, {
      autoConnect: false,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 5000,
    });
  }
  return socket;
};

export const connectSocket = (token?: string): Socket => {
  const currentToken = token || useAuthStore.getState().accessToken;
  const s = getSocket();

  if (currentToken) {
    s.auth = { token: currentToken };
  }

  if (!s.connected) {
    s.connect();
  }

  return s;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
  }
};
