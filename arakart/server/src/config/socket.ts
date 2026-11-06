import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './env';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket client connected: ${socket.id}`);

    socket.on('joinSellerRoom', (sellerId: string) => {
      if (sellerId) {
        socket.join(`seller:${sellerId}`);
        logger.debug(`Socket ${socket.id} joined seller room: seller:${sellerId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
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
