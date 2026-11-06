import http from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { initSocket, emitToSeller } from '../socket';
import { signAccessToken } from '../../utils/jwt.utils';

describe('Real-Time Socket.IO Server & Lead Notifications (INT-003)', () => {
  let httpServer: http.Server;
  let serverPort: number;

  beforeAll((done) => {
    httpServer = http.createServer();
    initSocket(httpServer);
    httpServer.listen(() => {
      serverPort = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  it('rejects socket connection without authentication token', (done) => {
    const client: ClientSocket = Client(`http://localhost:${serverPort}`, {
      autoConnect: true,
      transports: ['websocket'],
    });

    client.on('connect_error', (err: any) => {
      expect(err.message).toMatch(/Authentication required|jwt|token/i);
      client.disconnect();
      done();
    });
  });

  it('authenticates valid seller token and auto-joins seller room to receive newLead events', (done) => {
    const sellerProviderId = '507f1f77bcf86cd799439099';
    const sellerToken = signAccessToken({
      userId: 'user_seller_1',
      role: 'seller',
      sellerId: sellerProviderId,
    });

    const client: ClientSocket = Client(`http://localhost:${serverPort}`, {
      auth: { token: sellerToken },
      transports: ['websocket'],
    });

    client.on('connect', () => {
      // Server emits to seller room
      const mockLeadData = {
        id: 'lead123',
        type: 'call',
        customerName: 'Sunita Kumari',
        createdAt: new Date().toISOString(),
      };

      client.on('newLead', (data: any) => {
        expect(data).toMatchObject({
          id: 'lead123',
          type: 'call',
          customerName: 'Sunita Kumari',
        });
        client.disconnect();
        done();
      });

      emitToSeller(sellerProviderId, 'newLead', mockLeadData);
    });
  });

  it('does not deliver leads from seller A to seller B (room isolation)', (done) => {
    const sellerAProviderId = '507f1f77bcf86cd799439001';
    const sellerBProviderId = '507f1f77bcf86cd799439002';

    const sellerBToken = signAccessToken({
      userId: 'user_seller_B',
      role: 'seller',
      sellerId: sellerBProviderId,
    });

    const clientB: ClientSocket = Client(`http://localhost:${serverPort}`, {
      auth: { token: sellerBToken },
      transports: ['websocket'],
    });

    clientB.on('connect', () => {
      const mockLeadA = { id: 'leadA', type: 'whatsapp', customerName: 'Rajesh' };
      const receivedMock = jest.fn();

      clientB.on('newLead', receivedMock);

      // Emit to Seller A only
      emitToSeller(sellerAProviderId, 'newLead', mockLeadA);

      setTimeout(() => {
        expect(receivedMock).not.toHaveBeenCalled();
        clientB.disconnect();
        done();
      }, 300);
    });
  });
});
