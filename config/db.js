import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log(`\x1b[32m%s\x1b[0m`, `✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `❌ Error connecting to MongoDB: ${error.message}`);
    // Don't exit process, allow the app to run in disconnected state if possible
    // Or at least allow the server to remain alive
  }
};

export const getDBStatus = () => isConnected;

export default connectDB;
