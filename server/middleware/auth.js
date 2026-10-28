import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Also support token query parameter for EventSource / SSE connections
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. No token provided.',
      code: 'AUTH_TOKEN_MISSING',
    });
  }

  jwt.verify(token, config.jwtSecret, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token.',
        code: 'AUTH_TOKEN_INVALID',
      });
    }

    req.user = decodedUser;
    next();
  });
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges required.',
      code: 'FORBIDDEN_ADMIN_ONLY',
    });
  }
  next();
}

export function requireAuthor(req, res, next) {
  if (!req.user || req.user.role !== 'author') {
    return res.status(403).json({
      error: 'Access denied. Author privileges required.',
      code: 'FORBIDDEN_AUTHOR_ONLY',
    });
  }
  next();
}
