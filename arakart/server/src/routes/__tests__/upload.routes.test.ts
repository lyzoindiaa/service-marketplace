import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { makeUser, makeProvider } from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Photo Upload Routes (INT-005)', () => {
  let sellerUser: any;
  let sellerProvider: any;
  let sellerAuthHeader: { Authorization: string };

  beforeEach(async () => {
    sellerUser = await makeUser({ role: 'seller', phone: '9876543210' });
    sellerProvider = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Verma Electric Works',
      photos: ['https://res.cloudinary.com/demo/image/upload/sample1.webp'],
    });
    sellerAuthHeader = authHeaderFor(sellerUser);
  });

  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  ]);

  it('POST /api/v1/sellers/me/photos uploads a valid image and appends to provider photos', async () => {
    const res = await request(app)
      .post('/api/v1/sellers/me/photos')
      .set(sellerAuthHeader)
      .attach('photo', validPngBuffer, { filename: 'shop.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.photos).toHaveLength(2);
    expect(res.body.data.photos[1]).toMatch(/cloudinary\.com|mock_photo/);

    // Verify persisted in DB
    const updated = await Provider.findById(sellerProvider._id);
    expect(updated?.photos).toHaveLength(2);
  });

  it('POST /api/v1/sellers/me/photos rejects non-image MIME types with 422', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 dummy pdf');

    const res = await request(app)
      .post('/api/v1/sellers/me/photos')
      .set(sellerAuthHeader)
      .attach('photo', pdfBuffer, { filename: 'document.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only jpeg, png, and webp/i);
  });

  it('POST /api/v1/sellers/me/photos rejects files larger than 2MB with 422', async () => {
    // 2.5MB buffer
    const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024);

    const res = await request(app)
      .post('/api/v1/sellers/me/photos')
      .set(sellerAuthHeader)
      .attach('photo', largeBuffer, { filename: 'heavy.png', contentType: 'image/png' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/maximum size is 2mb/i);
  });

  it('POST /api/v1/sellers/me/photos rejects 7th photo when 6 photos already exist with 422', async () => {
    // Fill provider with 6 photos
    await Provider.findByIdAndUpdate(sellerProvider._id, {
      photos: [
        'photo1.webp',
        'photo2.webp',
        'photo3.webp',
        'photo4.webp',
        'photo5.webp',
        'photo6.webp',
      ],
    });

    const res = await request(app)
      .post('/api/v1/sellers/me/photos')
      .set(sellerAuthHeader)
      .attach('photo', validPngBuffer, { filename: 'seventh.png', contentType: 'image/png' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/maximum 6 photos/i);
  });

  it('DELETE /api/v1/sellers/me/photos removes photo URL from provider document', async () => {
    const photoToDelete = 'https://res.cloudinary.com/demo/image/upload/sample1.webp';

    const res = await request(app)
      .delete('/api/v1/sellers/me/photos')
      .set(sellerAuthHeader)
      .send({ photoUrl: photoToDelete });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.photos).not.toContain(photoToDelete);

    // Verify DB
    const updated = await Provider.findById(sellerProvider._id);
    expect(updated?.photos).toHaveLength(0);
  });

  it('rejects unauthenticated photo upload with 401', async () => {
    const res = await request(app)
      .post('/api/v1/sellers/me/photos')
      .attach('photo', Buffer.from('data'), { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
  });
});
