// backend/src/middleware/upload.js
// -------------------------------------------------------------
// This middleware configures Multer for handling photo uploads.
// For beginners: Multer parses multipart/form-data requests (which is how
// HTML forms send binary files like photos alongside text fields).
//
// Rules enforced:
// 1. Files are saved in backend/uploads with a random UUID to avoid naming collisions.
// 2. The original file extension (.jpg, .png, .webp) is preserved.
// 3. Only image formats (JPG, PNG, WebP) are accepted.
// 4. File size limit is strictly 5 MB.
// 5. Any upload error responds with a user-friendly 400 JSON error instead of crashing.
// -------------------------------------------------------------

import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the backend/uploads directory exists
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration: save to uploads/ with crypto.randomUUID() filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// File filter: reject non-image files
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeValid = ALLOWED_MIME_TYPES.has(file.mimetype);
  const isExtValid = ALLOWED_EXTENSIONS.has(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    const err = new Error('Only JPG, PNG, and WebP image files are allowed');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
}

const multerInstance = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
  fileFilter,
});

/**
 * Middleware wrapper that catches any Multer upload errors
 * and turns them into clean HTTP 400 JSON responses.
 *
 * @param {string} fieldName - The multipart form field name (defaults to 'image')
 */
export function uploadSingleImage(fieldName = 'image') {
  const uploadHandler = multerInstance.single(fieldName);

  return (req, res, next) => {
    uploadHandler(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum size is 5 MB' });
        }
        return res.status(400).json({ error: err.message || 'Invalid file upload' });
      }
      next();
    });
  };
}

export default multerInstance;
