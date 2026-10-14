// backend/src/routes/notifications.js
// -------------------------------------------------------------
// This file handles user alerts and notifications:
// - GET  /api/notifications          : Lists all notifications for the logged-in user, newest first
// - POST /api/notifications/read-all : Marks all notifications as read (read = 1) for the logged-in user
// -------------------------------------------------------------

import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

// GET /api/notifications
// Returns the logged-in user's notifications, newest first
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT id, user_id, type, title, message, link, read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  const notifications = rows.map(row => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    read: Boolean(row.read),
    createdAt: row.created_at,
    created_at: row.created_at,
  }));

  return res.json(notifications);
});

// POST /api/notifications/read-all
// Marks all notifications as read for the logged-in user
router.post('/read-all', (req, res) => {
  db.prepare(`
    UPDATE notifications
    SET read = 1
    WHERE user_id = ?
  `).run(req.user.id);

  return res.json({ ok: true });
});

export default router;
