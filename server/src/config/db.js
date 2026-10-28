const mongoose = require("mongoose");
const { DATABASE_URL } = require("./env");

/**
 * Global cache across serverless function invocations in Vercel.
 */
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = DATABASE_URL || process.env.DATABASE_URL;
    if (!uri) {
      throw new Error("DATABASE_URL is not defined in environment variables.");
    }

    const opts = {
      dbName: "karakurum",
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      bufferCommands: false, // Fail fast if disconnected instead of waiting 10s for buffering timeout
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`✅ MongoDB Atlas Connected: ${m.connection.host}/${m.connection.name}`);
      cached.conn = m.connection;
      return cached.conn;
    }).catch((err) => {
      cached.promise = null;
      console.error("❌ MongoDB Atlas Connection Error:", err.message);
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
}

module.exports = { connectDB, mongoose };
