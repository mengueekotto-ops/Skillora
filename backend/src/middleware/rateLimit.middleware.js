/**
 * Small in-memory rate limiter (no external dependency).
 * Counts attempts per key within a sliding window and answers 429 when exceeded.
 * For several server instances, replace the Map with a shared store (e.g. Redis).
 */
const createRateLimiter = ({ windowMs, max, keyFn, message }) => {
  const hits = new Map(); // key -> array of timestamps

  // Periodically forget old entries so memory stays bounded
  const sweep = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const recent = times.filter((t) => t > cutoff);
      if (recent.length) hits.set(key, recent);
      else hits.delete(key);
    }
  }, windowMs).unref();
  void sweep;

  return (req, res, next) => {
    // Test runs only (e2e creates many accounts quickly); never honoured in production
    if (process.env.RATE_LIMIT_DISABLED === "true" && process.env.NODE_ENV !== "production") return next();
    const key = keyFn(req);
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => t > now - windowMs);

    if (recent.length >= max) {
      const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message: message || `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        retryAfter,
      });
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
};

const clientIp = (req) => req.ip || req.socket?.remoteAddress || "unknown";
const identity = (req) => String((req.body || {}).email || "").trim().toLowerCase();

// Login: 10 attempts per 15 min for the same IP + account
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => `login:${clientIp(req)}:${identity(req)}`,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});

// Admin login: stricter — 5 attempts per 15 min per IP
const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (req) => `admin:${clientIp(req)}`,
  message: "Too many admin login attempts. Please wait 15 minutes.",
});

// Password reset requests/codes: 5 per 15 min per IP
const resetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (req) => `reset:${clientIp(req)}:${req.path}`,
  message: "Too many password reset attempts. Please wait 15 minutes.",
});

// Sign-up: 10 accounts per hour per IP
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyFn: (req) => `register:${clientIp(req)}`,
  message: "Too many accounts created from this network. Please try again later.",
});

module.exports = { createRateLimiter, loginLimiter, adminLoginLimiter, resetLimiter, registerLimiter };
