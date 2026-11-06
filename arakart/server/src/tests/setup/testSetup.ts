import mongoose from 'mongoose';
import net from 'net';

const checkPort = (port: number, host = '127.0.0.1'): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

export const setupTestDB = () => {
  beforeAll(async () => {
    const isLocalRunning = await checkPort(27017);
    if (isLocalRunning) {
      const uri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/arakart_test';
      await mongoose.connect(uri);
    } else {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
    }
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      // Clean up test database
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });
};
