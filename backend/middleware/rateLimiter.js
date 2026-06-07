const rateLimitStore = {};

/**
 * IP-based Rate Limiting Middleware (In-memory)
 * @param {number} limit - Maximum number of requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimiter = (limit, windowMs) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const now = Date.now();

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = [];
    }

    // Keep only timestamps within the sliding time window
    rateLimitStore[ip] = rateLimitStore[ip].filter(timestamp => now - timestamp < windowMs);

    if (rateLimitStore[ip].length >= limit) {
      return res.status(429).json({
        message: 'Too many login or registration attempts. Please try again in a few minutes.'
      });
    }

    rateLimitStore[ip].push(now);
    next();
  };
};

module.exports = rateLimiter;
