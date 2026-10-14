// backend/src/middleware/auth.js
// -------------------------------------------------------------
// This middleware handles user authentication using JSON Web Tokens (JWT).
// When a user logs in, the server gives them a token (a signed secure string).
// On subsequent requests, the frontend sends this token in the header:
// "Authorization: Bearer <token>"
//
// requireAuth: Stops the request with a 401 error if the token is missing or invalid.
// optionalAuth: Reads the token if present, sets req.user, but still allows guests.
// -------------------------------------------------------------

import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'findback_dev_jwt_secret';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare('SELECT id, name, email, whatsapp, campus, points, created_at FROM users WHERE id = ?')
      .get(payload.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = {
      ...user,
      createdAt: user.created_at,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare('SELECT id, name, email, whatsapp, campus, points, created_at FROM users WHERE id = ?')
      .get(payload.id);

    if (user) {
      req.user = {
        ...user,
        createdAt: user.created_at,
      };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }

  next();
}
