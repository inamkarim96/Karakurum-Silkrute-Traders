const mongoose = require("mongoose");
const { DATABASE_URL, NODE_ENV } = require("./env");
const ApiError = require("../utils/apiError");

/**
 * Global cache across serverless function invocations in Vercel.
 */
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

function databaseUnavailable(error) {
  return new ApiError(
    503,
    NODE_ENV === "production"
      ? "The database is temporarily unavailable. Please try again in a moment."
      : `Database unavailable: ${error.message}`,
    "DATABASE_UNAVAILABLE",
    { cause: error.message }
  );
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = DATABASE_URL || process.env.DATABASE_URL;
    if (!uri) {
      throw databaseUnavailable(new Error("DATABASE_URL is not defined in environment variables."));
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

      // Reset the cache if Atlas drops the connection so the next request reconnects.
      m.connection.on("disconnected", () => {
        cached.conn = null;
        cached.promise = null;
      });

      return cached.conn;
    }).catch((err) => {
      cached.promise = null;
      console.error("❌ MongoDB Atlas Connection Error:", err.name, err.message);
      if (err.reason) {
        console.error("❌ MongoDB Atlas Reason:", err.reason.message, err.reason.code);
      }
      throw databaseUnavailable(err);
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

/**
 * Lightweight connectivity report used by the health endpoint.
 * Never throws and never returns credentials or raw driver errors.
 */
async function getDbStatus(timeoutMs = 5000) {
  try {
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timed out")), timeoutMs)
      )
    ]);

    await mongoose.connection.db.admin().ping();
    return { connected: true, state: "connected" };
  } catch (error) {
    console.error("[db] Health check failed:", error.details?.cause || error.message);
    return { connected: false, state: "disconnected" };
  }
}

module.exports = { connectDB, getDbStatus, mongoose };
