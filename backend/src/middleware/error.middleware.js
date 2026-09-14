const errorHandler = (err, req, res, next) => {
  console.error("❌ Global Error Handler Caught:", err);

  // MongoDB duplicate key error (E11000)
  if (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000)) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    const fieldCapitalized = field.charAt(0).toUpperCase() + field.slice(1);
    return res.status(409).json({
      success: false,
      message: `An account with this ${field} already exists.`,
      error: `${fieldCapitalized} already exists in Skillora database.`,
      field,
    });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: messages,
    });
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format: ${err.value}`,
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
