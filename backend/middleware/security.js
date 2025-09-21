const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    code: 'LOGIN_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Password change rate limiting
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password changes per hour
  message: {
    success: false,
    message: 'Too many password change attempts, please try again later',
    code: 'PASSWORD_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request sanitization
const sanitizeInput = (req, res, next) => {
  // Remove null bytes and control characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No restriction if no IPs specified
    }

    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn(`Access denied for IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        code: 'IP_BLOCKED'
      });
    }

    next();
  };
};

// Request logging for security events
const securityLogger = (event) => {
  return (req, res, next) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null,
      path: req.path,
      method: req.method
    };

    console.log('Security Event:', JSON.stringify(logData));
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with security monitoring service
    }

    next();
  };
};

module.exports = {
  strictLimiter,
  loginLimiter,
  passwordLimiter,
  securityHeaders,
  sanitizeInput,
  ipWhitelist,
  securityLogger
};