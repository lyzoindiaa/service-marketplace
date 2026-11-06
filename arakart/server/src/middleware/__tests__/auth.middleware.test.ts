import { Request, Response, NextFunction } from 'express';
import { verifyToken, requireRole } from '../auth.middleware';
import { setupTestDB } from '../../tests/setup/testSetup';
import { makeUser } from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';
import { signAccessToken } from '../../utils/jwt.utils';

setupTestDB();

describe('Auth & Role Middleware (BE-006)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();
    req = { headers: {} };
    res = { status: statusMock, json: jsonMock };
    next = jest.fn();
  });

  describe('verifyToken', () => {
    it('populates req.user when valid Bearer token is provided', async () => {
      const user = await makeUser({ role: 'customer' });
      const auth = authHeaderFor(user);
      req.headers = { authorization: auth.Authorization };

      await verifyToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(user.id);
      expect(req.user?.role).toBe('customer');
    });

    it('returns 401 when Authorization header is missing', async () => {
      req.headers = {};

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authentication token required' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header is not Bearer format', async () => {
      req.headers = { authorization: 'Basic 12345' };

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user is suspended', async () => {
      const suspendedUser = await makeUser({ suspended: true });
      const auth = authHeaderFor(suspendedUser);
      req.headers = { authorization: auth.Authorization };

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringMatching(/suspended/i) })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('allows access when user has matching role', () => {
      req.user = { userId: '123', role: 'seller' };
      const middleware = requireRole('seller', 'admin');

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects with 403 when user role does not match required roles', () => {
      req.user = { userId: '123', role: 'customer' };
      const middleware = requireRole('seller', 'admin');

      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringMatching(/Access denied/i) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects with 401 when req.user is undefined', () => {
      req.user = undefined;
      const middleware = requireRole('admin');

      middleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
