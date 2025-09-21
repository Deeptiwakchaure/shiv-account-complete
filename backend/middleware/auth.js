const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Verify JWT token with enhanced security
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Additional token validation
    if (!decoded.userId || !decoded.iat) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure',
        code: 'TOKEN_INVALID'
      });
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if token was issued before password change
    if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({
        success: false,
        message: 'Token invalid due to password change',
        code: 'TOKEN_OUTDATED'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active yet',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Enhanced role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`Access denied for user ${req.user._id} with role ${req.user.role}. Required: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Optional authentication with better error handling
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token && !tokenBlacklist.has(token)) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        // Check token validity against password changes
        if (!user.passwordChangedAt || decoded.iat >= Math.floor(user.passwordChangedAt.getTime() / 1000)) {
          req.user = user;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // Log error but continue without authentication
    if (process.env.NODE_ENV === 'development') {
      console.log('Optional auth failed:', error.message);
    }
    next();
  }
};

// Revoke token (logout)
const revokeToken = (req, res, next) => {
  if (req.token) {
    tokenBlacklist.add(req.token);
  }
  next();
};

// Admin only middleware
const adminOnly = authorize('Admin');

// Admin or Accountant middleware
const adminOrAccountant = authorize('Admin', 'Accountant');

// Self or Admin access (for user profile operations)
const selfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  const isOwner = req.user._id.toString() === targetUserId;
  const isAdmin = req.user.role === 'Admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - can only access own resources or admin required',
      code: 'ACCESS_DENIED'
    });
  }

  next();
};

// Validate JWT secret exists
const validateJWTConfig = () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is required');
    process.exit(1);
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('JWT_SECRET should be at least 32 characters long for security');
  }
};

// Clean expired tokens from blacklist (call periodically)
const cleanTokenBlacklist = () => {
  // In production, implement proper cleanup with Redis TTL
  if (tokenBlacklist.size > 10000) {
    tokenBlacklist.clear();
    console.log('Token blacklist cleared due to size limit');
  }
};

// Set cleanup interval
setInterval(cleanTokenBlacklist, 60 * 60 * 1000); // Every hour

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth,
  revokeToken,
  adminOnly,
  adminOrAccountant,
  selfOrAdmin,
  authLimiter,
  validateJWTConfig,
  cleanTokenBlacklist
};
