// backend/src/server.js
// -------------------------------------------------------------
// This is the main entry point for the FindBack backend server.
// It sets up Express, middleware for CORS (allowing frontend on port 5173 to connect),
// JSON body parsing, static file hosting for uploaded photos (/uploads),
// and connects our API routes (/api).
// -------------------------------------------------------------

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Initialize database (creates tables on startup if missing)
import db from './db.js';

// Route modules
import authRoutes from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Enable Cross-Origin Resource Sharing (CORS) for the frontend
app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Ensure the uploads folder exists and serve files statically at /uploads
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Mount API routes under /api
app.use('/api', authRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Final global error handler - returns clean JSON errors, never crashes the app
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`FindBack backend server running on http://localhost:${PORT}`);
  });
}

export default app;
