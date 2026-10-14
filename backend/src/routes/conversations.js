// backend/src/routes/conversations.js
// -------------------------------------------------------------
// This file manages private claim conversations and messaging between
// the person who lost an item and the student who found it:
// - POST /api/conversations             : Start or retrieve a claim chat
// - GET  /api/conversations             : List my chats (newest activity first)
// - GET  /api/conversations/:id         : Get details for one chat (participants only)
// - GET  /api/conversations/:id/messages: Fetch messages in a chat (with ?after= filter)
// - POST /api/conversations/:id/messages: Send a new message (1-1000 characters)
//
// Rules enforced:
// 1. Only participants can view or send messages (403 for outsiders).
// 2. Messaging is only allowed when status is 'chatting' or 'matched' (400 'This chat is closed' otherwise).
// 3. You cannot claim or start a conversation on your own item.
// 4. Contact information is strictly protected until a match is confirmed.
// -------------------------------------------------------------

import { Router } from 'express';
import crypto from 'node:crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { formatConversation } from '../lib/formatConversation.js';

const router = Router();

// All conversation routes require user authentication
router.use(requireAuth);

// POST /api/conversations
// Starts a new claim chat or returns an existing one for (found_item_id, owner_id)
router.post('/', (req, res) => {
  const { foundItemId, lostItemId } = req.body || {};

  if (!foundItemId || typeof foundItemId !== 'string') {
    return res.status(400).json({ error: 'foundItemId is required' });
  }

  // Look up the target item
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(foundItemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Rule 1: Item must be type 'found'
  if (item.type !== 'found') {
    return res.status(400).json({ error: 'Conversations can only be started for found items' });
  }

  // Rule 2: Item must not be already returned
  if (item.status === 'returned') {
    return res.status(400).json({ error: 'This item has already been returned' });
  }

  // Rule 3: User cannot chat on their own found report
  if (item.reporter_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot start a conversation on your own item' });
  }

  // Check if a conversation already exists between this owner and found item
  const existing = db.prepare(`
    SELECT * FROM conversations
    WHERE found_item_id = ? AND owner_id = ?
  `).get(foundItemId, req.user.id);

  if (existing) {
    return res.json(formatConversation(existing, req.user.id));
  }

  // Create new conversation in a transaction
  const createConversationTx = db.transaction(() => {
    const convId = crypto.randomUUID();
    const now = Date.now();

    // 1. Insert conversation row (requester is owner, item reporter is finder)
    db.prepare(`
      INSERT INTO conversations (
        id, found_item_id, lost_item_id, owner_id, finder_id,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'chatting', ?, ?)
    `).run(
      convId,
      foundItemId,
      lostItemId || null,
      req.user.id,
      item.reporter_id,
      now,
      now
    );

    // 2. Insert initial system message
    const msgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, kind, text, created_at)
      VALUES (?, ?, NULL, 'system', 'Chat started', ?)
    `).run(msgId, convId, now);

    // 3. Insert notification for the finder
    const notifId = crypto.randomUUID();
    const cleanDesc = (item.description || 'an item').slice(0, 35);
    db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, link, read, created_at
      ) VALUES (?, ?, 'claim', 'New Claim Request', ?, ?, 0, ?)
    `).run(
      notifId,
      item.reporter_id,
      `${req.user.name} started a chat about "${cleanDesc}"`,
      `/people?chat=${convId}`,
      now
    );

    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
  });

  const newConv = createConversationTx();
  return res.status(201).json(formatConversation(newConv, req.user.id));
});

// GET /api/conversations
// Lists conversations for the logged-in user (as owner or finder), newest activity first
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM conversations
    WHERE owner_id = ? OR finder_id = ?
    ORDER BY updated_at DESC
  `).all(req.user.id, req.user.id);

  const formatted = rows.map(conv => formatConversation(conv, req.user.id));
  return res.json(formatted);
});

// GET /api/conversations/:id
// Retrieves a single conversation by ID (participants only)
router.get('/:id', (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Authorization check: participant only
  if (conv.owner_id !== req.user.id && conv.finder_id !== req.user.id) {
    return res.status(403).json({ error: 'You are not a participant in this conversation' });
  }

  return res.json(formatConversation(conv, req.user.id));
});

// GET /api/conversations/:id/messages?after=<ms>
// Returns messages newer than `after` (all if omitted), sorted oldest first
router.get('/:id/messages', (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Authorization check: participant only
  if (conv.owner_id !== req.user.id && conv.finder_id !== req.user.id) {
    return res.status(403).json({ error: 'You are not a participant in this conversation' });
  }

  const { after } = req.query;
  let messages = [];

  if (after !== undefined && after !== '') {
    const afterMs = Number(after) || 0;
    messages = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ? AND created_at > ?
      ORDER BY created_at ASC
    `).all(conv.id, afterMs);
  } else {
    messages = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conv.id);
  }

  const formatted = messages.map(msg => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    kind: msg.kind,
    text: msg.text,
    createdAt: msg.created_at,
    isMine: msg.sender_id === req.user.id,
  }));

  return res.json(formatted);
});

// POST /api/conversations/:id/messages
// Sends a new message in the conversation (1-1000 characters)
router.post('/:id/messages', (req, res) => {
  const { text } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 1000) {
    return res.status(400).json({ error: 'Message must be between 1 and 1000 characters' });
  }

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Authorization check: participant only
  if (conv.owner_id !== req.user.id && conv.finder_id !== req.user.id) {
    return res.status(403).json({ error: 'You are not a participant in this conversation' });
  }

  // State check: chatting or matched only
  if (conv.status !== 'chatting' && conv.status !== 'matched') {
    return res.status(400).json({ error: 'This chat is closed' });
  }

  const msgId = crypto.randomUUID();
  const now = Date.now();

  const insertMsgTx = db.transaction(() => {
    // 1. Insert message
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, kind, text, created_at)
      VALUES (?, ?, ?, 'text', ?, ?)
    `).run(msgId, conv.id, req.user.id, text.trim(), now);

    // 2. Update conversation updated_at timestamp
    db.prepare(`
      UPDATE conversations
      SET updated_at = ?
      WHERE id = ?
    `).run(now, conv.id);
  });

  insertMsgTx();

  return res.status(201).json({
    id: msgId,
    conversationId: conv.id,
    senderId: req.user.id,
    kind: 'text',
    text: text.trim(),
    createdAt: now,
    isMine: true,
  });
});

// POST /api/conversations/:id/match
// Finder decides whether the claimed item is a match ('matched' | 'not_matched')
// Only allowed for the finder while status is 'chatting'
router.post('/:id/match', (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Role check: Only the finder can decide a match
  if (conv.finder_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the finder can make a match decision' });
  }

  // State check: Must be in 'chatting' status
  if (conv.status !== 'chatting') {
    return res.status(400).json({ error: 'Match decision can only be made while chatting' });
  }

  const { decision, explanation } = req.body || {};

  if (decision !== 'matched' && decision !== 'not_matched') {
    return res.status(400).json({ error: "Decision must be 'matched' or 'not_matched'" });
  }

  const cleanExplanation = (explanation || '').trim();

  // Negative decision requires explanation >= 15 characters
  if (decision === 'not_matched' && cleanExplanation.length < 15) {
    return res.status(400).json({ error: 'Please explain what happened (at least 15 characters)' });
  }

  const now = Date.now();

  const matchTx = db.transaction(() => {
    if (decision === 'matched') {
      // 1. Update conversation status to matched
      db.prepare(`
        UPDATE conversations
        SET status = 'matched', matched_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, conv.id);

      // 2. Update found item status to matched
      db.prepare(`
        UPDATE items
        SET status = 'matched'
        WHERE id = ?
      `).run(conv.found_item_id);

      // 3. Insert system message
      const systemMsg = cleanExplanation
        ? `The finder confirmed this is a match. Note: ${cleanExplanation}`
        : 'The finder confirmed this is a match.';

      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, kind, text, created_at)
        VALUES (?, ?, NULL, 'system', ?, ?)
      `).run(crypto.randomUUID(), conv.id, systemMsg, now);

      // 4. Notification to owner
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
        VALUES (?, ?, 'match', 'Match Confirmed!', 'The finder confirmed your item is a match. You can now coordinate the return.', ?, 0, ?)
      `).run(crypto.randomUUID(), conv.owner_id, `/people?chat=${conv.id}`, now);

      // 5. Record feedback row
      db.prepare(`
        INSERT INTO feedback (id, conversation_id, user_id, stage, outcome, explanation, created_at)
        VALUES (?, ?, ?, 'match', 'matched', ?, ?)
      `).run(crypto.randomUUID(), conv.id, req.user.id, cleanExplanation || null, now);
    } else {
      // not_matched
      // 1. Update conversation status to not_matched (chat becomes read-only)
      db.prepare(`
        UPDATE conversations
        SET status = 'not_matched', closed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, conv.id);

      // 2. Found item stays reported
      db.prepare(`
        UPDATE items
        SET status = 'reported'
        WHERE id = ?
      `).run(conv.found_item_id);

      // 3. System message showing explanation
      const systemMsg = `The finder said this is not a match: "${cleanExplanation}"`;

      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, kind, text, created_at)
        VALUES (?, ?, NULL, 'system', ?, ?)
      `).run(crypto.randomUUID(), conv.id, systemMsg, now);

      // 4. Notification to owner
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
        VALUES (?, ?, 'not_matched', 'Match Declined', 'The finder indicated this item is not a match.', ?, 0, ?)
      `).run(crypto.randomUUID(), conv.owner_id, `/people?chat=${conv.id}`, now);

      // 5. Record feedback row
      db.prepare(`
        INSERT INTO feedback (id, conversation_id, user_id, stage, outcome, explanation, created_at)
        VALUES (?, ?, ?, 'match', 'not_matched', ?, ?)
      `).run(crypto.randomUUID(), conv.id, req.user.id, cleanExplanation, now);
    }

    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(conv.id);
  });

  const updatedConv = matchTx();
  return res.json(formatConversation(updatedConv, req.user.id));
});

// POST /api/conversations/:id/return
// Owner confirms whether the item was returned ('returned' | 'not_returned')
// Only allowed for the owner while status is 'matched'
router.post('/:id/return', (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Role check: Only the owner can confirm a return
  if (conv.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the item owner can confirm a return' });
  }

  // State check: Must be in 'matched' status
  if (conv.status !== 'matched') {
    return res.status(400).json({ error: 'Return decision can only be made after a match is confirmed' });
  }

  const { decision, explanation } = req.body || {};

  if (decision !== 'returned' && decision !== 'not_returned') {
    return res.status(400).json({ error: "Decision must be 'returned' or 'not_returned'" });
  }

  const cleanExplanation = (explanation || '').trim();

  // Negative decision requires explanation >= 15 characters
  if (decision === 'not_returned' && cleanExplanation.length < 15) {
    return res.status(400).json({ error: 'Please explain what happened (at least 15 characters)' });
  }

  const now = Date.now();

  const returnTx = db.transaction(() => {
    if (decision === 'returned') {
      // 1. Update conversation status to returned
      db.prepare(`
        UPDATE conversations
        SET status = 'returned', closed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, conv.id);

      // 2. Found item status -> returned with returned_at
      db.prepare(`
        UPDATE items
        SET status = 'returned', returned_at = ?
        WHERE id = ?
      `).run(now, conv.found_item_id);

      // 3. Owner's linked lost item (if any) -> returned with returned_at
      if (conv.lost_item_id) {
        db.prepare(`
          UPDATE items
          SET status = 'returned', returned_at = ?
          WHERE id = ?
        `).run(now, conv.lost_item_id);
      }

      // 4. Finder gets +50 reward points
      db.prepare(`
        UPDATE users
        SET points = points + 50
        WHERE id = ?
      `).run(conv.finder_id);

      // 5. System message inside this chat
      const systemMsg = cleanExplanation
        ? `The owner confirmed the item was returned. +50 points to the finder. Note: ${cleanExplanation}`
        : 'The owner confirmed the item was returned. +50 points to the finder.';

      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, kind, text, created_at)
        VALUES (?, ?, NULL, 'system', ?, ?)
      `).run(crypto.randomUUID(), conv.id, systemMsg, now);

      // 6. Notification to finder
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
        VALUES (?, ?, 'returned', 'Item Returned! (+50 Points)', 'The owner confirmed receiving their item. You earned 50 points!', ?, 0, ?)
      `).run(crypto.randomUUID(), conv.finder_id, `/people?chat=${conv.id}`, now);

      // 7. Feedback row
      db.prepare(`
        INSERT INTO feedback (id, conversation_id, user_id, stage, outcome, explanation, created_at)
        VALUES (?, ?, ?, 'return', 'returned', ?, ?)
      `).run(crypto.randomUUID(), conv.id, req.user.id, cleanExplanation || null, now);

      // 8. Close all OTHER conversations on this found item that are still chatting
      const otherChats = db.prepare(`
        SELECT id, owner_id
        FROM conversations
        WHERE found_item_id = ? AND id != ? AND status = 'chatting'
      `).all(conv.found_item_id, conv.id);

      for (const other of otherChats) {
        db.prepare(`
          UPDATE conversations
          SET status = 'not_matched', closed_at = ?, updated_at = ?
          WHERE id = ?
        `).run(now, now, other.id);

        db.prepare(`
          INSERT INTO messages (id, conversation_id, sender_id, kind, text, created_at)
          VALUES (?, ?, NULL, 'system', 'This item has already been returned', ?)
        `).run(crypto.randomUUID(), other.id, now);

        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
          VALUES (?, ?, 'closed', 'Chat Closed', 'This item has already been returned to its owner.', ?, 0, ?)
        `).run(crypto.randomUUID(), other.owner_id, `/people?chat=${other.id}`, now);
      }
    } else {
      // not_returned
      // 1. Update conversation status to not_returned (chat becomes read-only)
      db.prepare(`
        UPDATE conversations
        SET status = 'not_returned', closed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, conv.id);

      // 2. Found item goes back to reported so it is browsable again
      db.prepare(`
        UPDATE items
        SET status = 'reported'
        WHERE id = ?
      `).run(conv.found_item_id);

      // 3. System message showing explanation
      const systemMsg = `The owner said the item was not returned: "${cleanExplanation}"`;

      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, kind, text, created_at)
        VALUES (?, ?, NULL, 'system', ?, ?)
      `).run(crypto.randomUUID(), conv.id, systemMsg, now);

      // 4. Notification to finder
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
        VALUES (?, ?, 'not_returned', 'Return Not Confirmed', 'The owner indicated the item was not returned.', ?, 0, ?)
      `).run(crypto.randomUUID(), conv.finder_id, `/people?chat=${conv.id}`, now);

      // 5. Feedback row
      db.prepare(`
        INSERT INTO feedback (id, conversation_id, user_id, stage, outcome, explanation, created_at)
        VALUES (?, ?, ?, 'return', 'not_returned', ?, ?)
      `).run(crypto.randomUUID(), conv.id, req.user.id, cleanExplanation, now);
    }

    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(conv.id);
  });

  const updatedConv = returnTx();
  return res.json(formatConversation(updatedConv, req.user.id));
});

export default router;
