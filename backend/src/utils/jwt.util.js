const jwt = require("jsonwebtoken");

/**
 * Single source of truth for the JWT secret.
 * The server refuses to sign or verify tokens without a configured secret,
 * so a missing .env can never fall back to a guessable default.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "your_jwt_secret_key") {
    throw new Error("JWT_SECRET is not configured. Set a long random value in backend/.env.");
  }
  return secret;
};

const signToken = (payload, { expiresIn } = {}) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "7d" });

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = { getJwtSecret, signToken, verifyToken };
