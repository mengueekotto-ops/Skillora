require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const { connectDB, mongoose } = require("./src/config/database");

async function testConnection() {
  console.log("--------------------------------------------------");
  console.log("🔍 Testing MongoDB Connection for Skillora...");
  console.log("📍 Configured MONGO_URI:", process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("--------------------------------------------------");

  try {
    const conn = await connectDB();
    console.log(`✅ Success! Connected to MongoDB host: ${conn.connection.host}`);
    console.log(`📂 Database Name: ${conn.connection.name}`);
    console.log(`🔌 Connection State: ${conn.connection.readyState === 1 ? 'Connected (1)' : conn.connection.readyState}`);

    // List collections in the database
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📊 Total Collections in '${conn.connection.name}': ${collections.length}`);
    if (collections.length > 0) {
      console.log("  Collections:", collections.map(c => c.name).join(", "));
    } else {
      console.log("  (Database is empty and ready for new data)");
    }

    await mongoose.disconnect();
    console.log("👋 Disconnected cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection Test Failed!");
    console.error("Error Message:", err.message);
    if (err.message.includes("ECONNREFUSED")) {
      console.error("💡 Hint: Ensure your MongoDB local server is running on localhost:27017 (mongod daemon).");
    }
    process.exit(1);
  }
}

testConnection();
