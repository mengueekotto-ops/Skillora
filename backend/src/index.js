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
const paymentRoutes = require("./routes/payment.route");

const errorHandler = require("./middleware/error.middleware");

const { getJwtSecret } = require("./utils/jwt.util");

// Fail fast: never run without a signing secret
getJwtSecret();

const app = express();

// Only these front-end origins may call the API from a browser (comma-separated in CORS_ORIGINS)
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Global Middleware
app.disable("x-powered-by");
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / server-to-server tools (no Origin header) and listed front-ends
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  })
);
// 15mb allows base64-encoded images up to the 10MB upload limit
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

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
    aiConfigured: Boolean(process.env.OPENROUTER_API_KEY),
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
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res) => {
      // Uploaded files are data, never executable pages
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; media-src 'self'");
    },
  })
);

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
app.use("/api/payments", paymentRoutes);

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