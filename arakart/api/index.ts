import app from '../server/src/app';
import { connectDB } from '../server/src/config/db';

let isConnected = false;

export default async function handler(req: any, res: any) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel API Handler Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err?.message || 'Database or server initialization failed',
    });
  }
}
