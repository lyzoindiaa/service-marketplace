import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const accessToken = useAuthStore.getState().accessToken;
    socket = io(window.location.origin, {
      autoConnect: false,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
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
