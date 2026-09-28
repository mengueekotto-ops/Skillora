const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/my_project_db";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = {
  connectDB,
  mongoose,
};