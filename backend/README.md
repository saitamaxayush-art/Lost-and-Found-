# FindBack Backend

This backend is a lightweight Node.js & Express REST API that powers FindBack, a campus Lost & Found platform.
It uses SQLite (via `better-sqlite3`) to manage users, lost/found item reports, private claim chats, notifications, and recovery analytics.

---

### Folder Layout
- `src/routes/` - Route handlers for authentication, items, conversations, decisions, stats, and notifications.
- `src/middleware/` - Auth verification (`requireAuth`, `optionalAuth`) and photo upload validation (`multer`).
- `src/lib/` - Keyword matching engine (`matching.js`) and conversation serializer (`formatConversation.js`).
- `scripts/` - Automated database seeding (`seed.js`) and end-to-end smoke testing (`smoke.js`).
- `data/` - Storage location for the SQLite database file (`findback.db`).
- `uploads/` - Storage directory for uploaded item photos (served at `/uploads`).

---

### Commands Reference

Navigate to the `backend/` directory first:
```bash
cd backend
```

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server (Auto-reload on file changes)**
   ```bash
   npm run dev
   ```

3. **Run Production Server**
   ```bash
   npm start
   ```

4. **Seed Database with Sample Data**
   ```bash
   # Add demo users, hero item photos, and an 8-month analytics trend:
   npm run seed

   # Or completely reset all database tables before seeding:
   npm run seed -- --reset
   ```

5. **Run End-to-End Smoke Tests**
   *(Make sure the backend server is running in another terminal window first)*
   ```bash
   npm run smoke
   ```
