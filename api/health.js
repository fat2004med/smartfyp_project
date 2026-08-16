import connectDB, { getDBStatus } from '../config/db.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

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

  let isDbReady = false;
  let dbError = null;
  let counts = { projects: 0, users: 0, departments: 0 };

  try {
    await connectDB();
    isDbReady = getDBStatus();
    if (isDbReady) {
      counts.projects = await Project.countDocuments();
      counts.users = await User.countDocuments();
      counts.departments = await Department.countDocuments();
    }
  } catch (err) {
    dbError = err.message;
  }

  return res.status(isDbReady ? 200 : 503).json({
    status: isDbReady ? 'healthy' : 'degraded',
    database: isDbReady ? 'connected' : 'disconnected',
    dbError,
    serverless: true,
    platform: 'Vercel Serverless Functions',
    timestamp: new Date().toISOString(),
    counts,
  });
}
