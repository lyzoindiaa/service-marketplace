import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect database and start listening
const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    logger.info(`AraKart API Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
