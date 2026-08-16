import connectDB, { getDBStatus } from '../config/db.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Selected-Role'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let dbConnected = false;
  let dbError = null;
  try {
    await connectDB();
    dbConnected = getDBStatus();
  } catch (err) {
    dbError = err.message;
  }

  return res.status(200).json({
    success: true,
    message: 'Backend API serverless function is online and responding!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasViteApiUrl: Boolean(process.env.VITE_API_URL),
    },
    database: {
      connected: dbConnected,
      status: dbConnected ? 'Connected to MongoDB Atlas' : (dbError || 'Disconnected'),
    },
  });
}
