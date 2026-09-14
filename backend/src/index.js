require("dotenv").config();

const express = require("express");
const cors = require("cors");

const path = require("path");

const { connectDB } = require("./config/database");
const { User } = require("./models");

const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const professionalRoutes = require("./routes/professional.route");
const categoryRoutes = require("./routes/category.route");
const serviceRoutes = require("./routes/service.route");
const requestRoutes = require("./routes/request.route");
const reviewRoutes = require("./routes/review.route");
const notificationRoutes = require("./routes/notification.route");
const adminRoutes = require("./routes/admin.route");
const aiRoutes = require("./routes/ai.route");
const verificationRoutes = require("./routes/verification.route");
const bookmarkRoutes = require("./routes/bookmark.route");
const uploadRoutes = require("./routes/upload.route");

const errorHandler = require("./middleware/error.middleware");

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fallback body middleware
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// Health Endpoint
app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    message: "Skillora API is running",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY"),
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Skillora — AI-Powered Artisan Marketplace & Verification Platform API 💎",
  });
});

// Serve Uploads directory statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/professionals", professionalRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/verifications", verificationRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/upload", uploadRoutes);

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Ensure unique indexes on User model
    await User.init();

    console.log("✅ MongoDB connected and User indexes synchronized.");

    app.listen(PORT, () => {
      console.log(`🚀 Skillora Backend Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();