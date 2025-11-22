// Simple in-memory rate limiter
const requestCounts = new Map();

// Rate limiter middleware
export const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100, // max requests per window
    message = 'Too many requests, please try again later.',
  } = options;

  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Get or create request record
    let record = requestCounts.get(identifier);
    
    if (!record) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(identifier, record);
      return next();
    }
    
    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      requestCounts.set(identifier, record);
      return next();
    }
    
    // Increment count
    record.count++;
    
    // Check if limit exceeded
    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }
    
    next();
  };
};

// Stricter rate limiter for submissions
export const submissionRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // max 10 submissions per hour
  message: 'Too many submissions. Please try again later.',
});

// Clean up old records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

export default {
  rateLimiter,
  submissionRateLimiter,
};
