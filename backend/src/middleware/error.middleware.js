const errorHandler = (err, req, res, next) => {
  console.error("❌ Global Error Handler Caught:", err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
