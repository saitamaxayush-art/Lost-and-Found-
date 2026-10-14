// backend/src/routes/auth.js
// -------------------------------------------------------------
// This file defines the authentication and profile routes for our API:
// - POST  /api/auth/login : Creates a user or updates existing details, returns a JWT token
// - GET   /api/me         : Returns the logged-in user's profile details
// - PATCH /api/me         : Updates name, whatsapp, or campus for the logged-in user
//
// All incoming data is carefully validated so bad or missing inputs
// return friendly 400 error messages instead of crashing the server.
// -------------------------------------------------------------

import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'findback_dev_jwt_secret';

// Helper: validate strings with minimum length
function isValidString(str, minLen = 2) {
  return typeof str === 'string' && str.trim().length >= minLen;
}

// Helper: validate email address format
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Helper: validate WhatsApp phone number (10 to 14 digits, optional leading +)
function isValidWhatsapp(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.trim().replace(/[\s()-]/g, '');
  return /^\+?[0-9]{10,14}$/.test(cleaned);
}

// Helper: format a user record consistently for API responses
function formatUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    campus: row.campus,
    points: Number(row.points || 0),
    created_at: row.created_at,
    createdAt: row.created_at,
  };
}

// POST /api/auth/login
// Creates a new user or updates an existing user by email.
// Returns a 7-day JWT token and the user's profile.
router.post('/auth/login', (req, res) => {
  const { name, email, whatsapp, campus } = req.body || {};

  // Input validation
  if (!isValidString(name, 2)) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (!isValidWhatsapp(whatsapp)) {
    return res
      .status(400)
      .json({ error: 'WhatsApp number must be 10 to 14 digits with optional leading +' });
  }
  if (!isValidString(campus, 2)) {
    return res.status(400).json({ error: 'Campus must be at least 2 characters long' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanWhatsapp = whatsapp.trim().replace(/[\s()-]/g, '');
  const cleanCampus = campus.trim();

  // Check if user already exists
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

  if (user) {
    // Update existing user details
    db.prepare(`
      UPDATE users
      SET name = ?, whatsapp = ?, campus = ?
      WHERE id = ?
    `).run(cleanName, cleanWhatsapp, cleanCampus, user.id);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  } else {
    // Create new user
    const newId = crypto.randomUUID();
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, name, email, whatsapp, campus, points, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(newId, cleanName, cleanEmail, cleanWhatsapp, cleanCampus, now);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
  }

  // Generate 7-day JWT
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return res.json({
    token,
    user: formatUser(user),
  });
});

// GET /api/me
// Returns the current logged-in user profile
router.get('/me', requireAuth, (req, res) => {
  return res.json(formatUser(req.user));
});

// PATCH /api/me
// Updates profile details (name, whatsapp, campus) for the logged-in user
router.patch('/me', requireAuth, (req, res) => {
  const { name, whatsapp, campus } = req.body || {};

  if (name === undefined && whatsapp === undefined && campus === undefined) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  let updatedName = req.user.name;
  let updatedWhatsapp = req.user.whatsapp;
  let updatedCampus = req.user.campus;

  if (name !== undefined) {
    if (!isValidString(name, 2)) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }
    updatedName = name.trim();
  }

  if (whatsapp !== undefined) {
    if (!isValidWhatsapp(whatsapp)) {
      return res
        .status(400)
        .json({ error: 'WhatsApp number must be 10 to 14 digits with optional leading +' });
    }
    updatedWhatsapp = whatsapp.trim().replace(/[\s()-]/g, '');
  }

  if (campus !== undefined) {
    if (!isValidString(campus, 2)) {
      return res.status(400).json({ error: 'Campus must be at least 2 characters long' });
    }
    updatedCampus = campus.trim();
  }

  db.prepare(`
    UPDATE users
    SET name = ?, whatsapp = ?, campus = ?
    WHERE id = ?
  `).run(updatedName, updatedWhatsapp, updatedCampus, req.user.id);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  return res.json(formatUser(updatedUser));
});

export default router;
