// backend/src/routes/items.js
// -------------------------------------------------------------
// This file handles all routes for Lost & Found item reports:
// - POST /api/items        : Reports a new lost or found item (with optional photo upload)
// - GET  /api/items/search : Smart keyword search across items (excluding returned items)
// - GET  /api/items/mine   : Lists all items reported by the logged-in user
// - GET  /api/items/:id    : Retrieves a single item by its ID
//
// Privacy Rule:
// Reporter email and whatsapp are NEVER returned in public item objects.
// Only the first name is exposed (e.g. "Alex").
// -------------------------------------------------------------

import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import db from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { tokenize, scoreItem } from '../lib/matching.js';

const router = Router();

/**
 * Formats an item record for public consumption.
 * Strictly strips sensitive personal data (email, whatsapp).
 *
 * @param {object} row - Database row from items table joined with users
 * @param {string|null} currentUserId - ID of currently authenticated user
 * @returns {object} Public item shape matching BACKEND_SPEC.md
 */
export function formatPublicItem(row, currentUserId = null) {
  if (!row) return null;

  // Extract first name only from reporter_name (or name)
  const rawName = (row.reporter_name || row.name || 'Student').trim();
  const firstName = rawName.split(/\s+/)[0] || 'Student';

  // Normalize image URL path
  let image = null;
  const rawImage = row.image_path || row.image;
  if (rawImage) {
    image = rawImage.startsWith('/') ? rawImage : `/${rawImage}`;
  }

  return {
    id: row.id,
    type: row.type,
    description: row.description,
    category: row.category,
    location: row.location,
    date: row.date,
    image,
    status: row.status,
    createdAt: row.created_at,
    reporterName: firstName,
    isMine: Boolean(currentUserId && row.reporter_id === currentUserId),
  };
}

// POST /api/items
// Reports a lost or found item (multipart/form-data with optional image)
router.post('/', requireAuth, uploadSingleImage('image'), (req, res) => {
  const { type, description, category, location, date } = req.body || {};

  // Clean-up helper in case validation fails and a photo was uploaded
  const cleanUploadedFile = () => {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to remove temp upload:', err);
      }
    }
  };

  // 1. Validate item type
  const normalizedType = typeof type === 'string' ? type.trim().toLowerCase() : '';
  if (normalizedType !== 'lost' && normalizedType !== 'found') {
    cleanUploadedFile();
    return res.status(400).json({ error: "Item type must be either 'lost' or 'found'" });
  }

  // 2. Validate description (minimum 3 characters)
  if (!description || typeof description !== 'string' || description.trim().length < 3) {
    cleanUploadedFile();
    return res.status(400).json({ error: 'Description must be at least 3 characters long' });
  }

  // 3. Validate category
  if (!category || typeof category !== 'string' || category.trim().length < 2) {
    cleanUploadedFile();
    return res.status(400).json({ error: 'Category is required' });
  }

  // 4. Validate location
  if (!location || typeof location !== 'string' || location.trim().length < 2) {
    cleanUploadedFile();
    return res.status(400).json({ error: 'Location is required' });
  }

  // 5. Validate date (YYYY-MM-DD format)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const itemDate = (date && typeof date === 'string' ? date.trim() : new Date().toISOString().slice(0, 10));
  if (!dateRegex.test(itemDate)) {
    cleanUploadedFile();
    return res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD' });
  }

  // Prepare database record
  const itemId = crypto.randomUUID();
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const now = Date.now();

  db.prepare(`
    INSERT INTO items (
      id, type, description, category, location, date,
      image_path, reporter_id, status, created_at, returned_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reported', ?, NULL)
  `).run(
    itemId,
    normalizedType,
    description.trim(),
    category.trim(),
    location.trim(),
    itemDate,
    imagePath,
    req.user.id,
    now
  );

  // Fetch the created item with the reporter's name
  const createdRow = db.prepare(`
    SELECT items.*, users.name AS reporter_name
    FROM items
    LEFT JOIN users ON items.reporter_id = users.id
    WHERE items.id = ?
  `).get(itemId);

  const formattedItem = formatPublicItem(createdRow, req.user.id);

  // Calculate possibleMatches:
  // - For 'lost' reports: up to 3 non-returned found items sharing at least one meaningful word
  // - For 'found' reports: empty array []
  let possibleMatches = [];
  if (normalizedType === 'lost') {
    const candidateFoundItems = db.prepare(`
      SELECT items.*, users.name AS reporter_name
      FROM items
      LEFT JOIN users ON items.reporter_id = users.id
      WHERE items.type = 'found' AND items.status != 'returned'
    `).all();

    const lostTokens = tokenize(`${description} ${category} ${location}`);

    const scoredCandidates = candidateFoundItems
      .map(candidate => {
        const { score, matchedWords, matchPercent } = scoreItem(lostTokens, candidate);
        return {
          item: candidate,
          score,
          matchedWords,
          matchPercent,
        };
      })
      .filter(entry => entry.score >= 1)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.item.created_at - a.item.created_at;
      })
      .slice(0, 3)
      .map(entry => ({
        ...formatPublicItem(entry.item, req.user.id),
        matchedWords: entry.matchedWords,
        matchPercent: entry.matchPercent,
      }));

    possibleMatches = scoredCandidates;
  }

  return res.status(201).json({
    item: formattedItem,
    possibleMatches,
  });
});

// GET /api/items/search?q=&type=&category=&status=
// Smart keyword search across items (returned items are strictly excluded)
// NOTE: Defined BEFORE /:id so Express does not confuse 'search' with an item ID
router.get('/search', optionalAuth, (req, res) => {
  const { q, type, category, status } = req.query || {};

  // If status query explicitly asks for 'returned', return empty because returned items are never searched
  if (status && status.toLowerCase() === 'returned') {
    return res.json([]);
  }

  // Base SQL query: exclude returned items
  let sql = `
    SELECT items.*, users.name AS reporter_name
    FROM items
    LEFT JOIN users ON items.reporter_id = users.id
    WHERE items.status != 'returned'
  `;
  const params = [];

  if (type && (type === 'lost' || type === 'found')) {
    sql += ` AND items.type = ?`;
    params.push(type.toLowerCase());
  }

  if (category && category.trim()) {
    sql += ` AND items.category = ?`;
    params.push(category.trim());
  }

  if (status && (status === 'reported' || status === 'matched')) {
    sql += ` AND items.status = ?`;
    params.push(status.toLowerCase());
  }

  sql += ` ORDER BY items.created_at DESC`;

  const rows = db.prepare(sql).all(...params);
  const currentUserId = req.user ? req.user.id : null;

  const rawQuery = (q || '').trim();

  // If query is empty, return newest items directly (no matchedWords)
  if (!rawQuery) {
    const formatted = rows.map(row => formatPublicItem(row, currentUserId));
    return res.json(formatted);
  }

  // Split query into distinct meaningful keyword tokens
  const queryWords = tokenize(rawQuery);

  // If query consists only of filler words (queryWords is empty), return empty array
  if (queryWords.length === 0) {
    return res.json([]);
  }

  // Score each item based on how many query words appear in description + category + location
  const scoredItems = [];

  for (const row of rows) {
    const { score, matchedWords, matchPercent } = scoreItem(queryWords, row);
    if (score >= 1) {
      scoredItems.push({
        item: row,
        score,
        matchedWords,
        matchPercent,
      });
    }
  }

  // Sort by highest score first, then by newest created_at
  scoredItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.item.created_at - a.item.created_at;
  });

  const results = scoredItems.map(entry => ({
    ...formatPublicItem(entry.item, currentUserId),
    matchedWords: entry.matchedWords,
    matchPercent: entry.matchPercent,
  }));

  return res.json(results);
});

// GET /api/items/mine
// Returns the logged-in user's own reports (all statuses: reported, matched, returned)
// NOTE: Defined BEFORE /:id so Express does not confuse 'mine' with an item ID
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT items.*, users.name AS reporter_name
    FROM items
    LEFT JOIN users ON items.reporter_id = users.id
    WHERE items.reporter_id = ?
    ORDER BY items.created_at DESC
  `).all(req.user.id);

  const formatted = rows.map(row => formatPublicItem(row, req.user.id));
  return res.json(formatted);
});

// GET /api/items
// List newest non-returned items (same as empty search)
router.get('/', optionalAuth, (req, res) => {
  const currentUserId = req.user ? req.user.id : null;
  const rows = db.prepare(`
    SELECT items.*, users.name AS reporter_name
    FROM items
    LEFT JOIN users ON items.reporter_id = users.id
    WHERE items.status != 'returned'
    ORDER BY items.created_at DESC
  `).all();

  const formatted = rows.map(row => formatPublicItem(row, currentUserId));
  return res.json(formatted);
});

// GET /api/items/:id
// Returns a single item by ID
router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;

  const row = db.prepare(`
    SELECT items.*, users.name AS reporter_name
    FROM items
    LEFT JOIN users ON items.reporter_id = users.id
    WHERE items.id = ?
  `).get(id);

  if (!row) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const currentUserId = req.user ? req.user.id : null;
  return res.json(formatPublicItem(row, currentUserId));
});

export default router;
