// backend/src/db.js
// -------------------------------------------------------------
// This file initializes and manages our SQLite database.
// For beginners: SQLite stores all your data in a single local file (findback.db).
// It runs quickly without needing a separate database server.
// Here we open the database, turn on foreign keys (so references between tables are checked),
// and create all necessary tables and indexes if they don't already exist.
// -------------------------------------------------------------

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data/ directory exists
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Path to the SQLite file
const dbPath = path.join(dataDir, 'findback.db');
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL');

// Create all tables and indexes defined in BACKEND_SPEC.md
db.exec(`
  -- Users table: stores user profiles, contact details, and gamification points
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    whatsapp TEXT NOT NULL,
    campus TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  -- Items table: stores reports for lost or found items
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('lost', 'found')),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    image_path TEXT,
    reporter_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'matched', 'returned')),
    created_at INTEGER NOT NULL,
    returned_at INTEGER,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Conversations table: private claim chats between item owner and finder
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    found_item_id TEXT NOT NULL,
    lost_item_id TEXT,
    owner_id TEXT NOT NULL,
    finder_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'chatting' CHECK(status IN ('chatting', 'matched', 'not_matched', 'returned', 'not_returned')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    matched_at INTEGER,
    closed_at INTEGER,
    UNIQUE (found_item_id, owner_id),
    FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (lost_item_id) REFERENCES items(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (finder_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Messages table: text messages and automated system notes inside conversations
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT,
    kind TEXT NOT NULL DEFAULT 'text' CHECK(kind IN ('text', 'system')),
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Feedback table: reasons and explanations when matches or returns are decided
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    stage TEXT NOT NULL CHECK(stage IN ('match', 'return')),
    outcome TEXT NOT NULL CHECK(outcome IN ('matched', 'not_matched', 'returned', 'not_returned')),
    explanation TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Notifications table: alerts sent to users regarding claims and item matches
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read INTEGER NOT NULL DEFAULT 0 CHECK(read IN (0, 1)),
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Indexes for fast lookups and sorting
  CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
  CREATE INDEX IF NOT EXISTS idx_items_reporter ON items(reporter_id);
  CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
  CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
  CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_finder ON conversations(finder_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
`);

export default db;
