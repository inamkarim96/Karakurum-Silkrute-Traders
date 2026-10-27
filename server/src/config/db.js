const mongoose = require("mongoose");
const { DATABASE_URL } = require("./env");

let isConnected = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = DATABASE_URL || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: "karakurum",
      serverSelectionTimeoutMS: 8000
    });
    isConnected = true;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error("❌ MongoDB Atlas Connection Error:", error.message);
    throw error;
  }
}

module.exports = { connectDB, mongoose };
