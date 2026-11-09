import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './env';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../utils/jwt.utils';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      credentials: true,
    },
  });

  // JWT Authentication handshake middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization
        ? socket.handshake.headers.authorization.replace('Bearer ', '')
        : null);

    if (!token) {
      return next(new Error('Authentication required for socket connection'));
    }

    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch {
      return next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    logger.debug(`Authenticated socket connected: ${socket.id} (user: ${user?.userId})`);

    // Automatically join seller room if user is seller with linked sellerId/providerId or userId
    if (user && user.sellerId) {
      const room = `seller:${user.sellerId}`;
      socket.join(room);
      logger.debug(`Socket ${socket.id} auto-joined room: ${room}`);
    }
    if (user && user.role === 'seller' && user.userId) {
      socket.join(`seller:${user.userId}`);
    }

    // Allow admin or verified owner to explicitly join seller room
    socket.on('joinSellerRoom', (sellerId: string) => {
      if (user && (user.role === 'admin' || user.sellerId === sellerId)) {
        socket.join(`seller:${sellerId}`);
        logger.debug(`Socket ${socket.id} joined seller room: seller:${sellerId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

export const emitToSeller = (sellerId: string, event: string, data: any): void => {
  try {
    const socketIO = getIO();
    socketIO.to(`seller:${sellerId}`).emit(event, data);
  } catch (err: any) {
    logger.debug(`Socket event '${event}' not emitted (socket server not active): ${err?.message}`);
  }
};
