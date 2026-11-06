import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, getSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';

export const useSocket = (sellerId?: string | null) => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = connectSocket(accessToken);
    socketRef.current = socket;

    if (sellerId) {
      socket.emit('joinSellerRoom', sellerId);
    }

    return () => {
      // Do not hard-disconnect if other components share socket; cleanup listeners if needed
    };
  }, [isAuthenticated, accessToken, sellerId]);

  return {
    socket: socketRef.current || getSocket(),
  };
};
