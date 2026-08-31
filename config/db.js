import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Global cache across serverless function warm executions in Node.js runtime
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Support both MONGODB_URI (standard Vercel/Atlas) and MONGO_URI
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    const errorMsg = "MongoDB URI not found! Please set MONGODB_URI or MONGO_URI in your Vercel Environment Variables.";
    console.error(`\x1b[31m%s\x1b[0m`, `❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // If already connected, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection promise is in progress, await it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Fail fast on operations if disconnected
      serverSelectionTimeoutMS: 10000, // 10s timeout to prevent serverless hang
      socketTimeoutMS: 45000,
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE ? parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) : 10,
    };

    console.log("🔄 Initializing new MongoDB connection pool...");
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log(`\x1b[32m%s\x1b[0m`, `✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error(`\x1b[31m%s\x1b[0m`, `❌ MongoDB Connection Failed: ${err.message}`);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export const getDBStatus = () => {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
};

export default connectDB;
