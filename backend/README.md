# FindBack Backend

This backend is a lightweight Node.js & Express API serving the FindBack campus Lost & Found application.
It uses a local SQLite database (via better-sqlite3) to handle users, lost & found items, claim chats, and notifications.

### Planned Folder Layout
- `src/routes/` - Route handlers for auth, items, conversations, decisions, and stats.
- `src/middleware/` - Auth verification (JWT) and input validation helpers.
- `scripts/` - Database initialization and sample data seed scripts.
- `data/` - Storage location for the SQLite database file (`findback.db`).
- `uploads/` - Storage directory for uploaded item photos.

### How to Start
1. Run `npm install` in this `backend/` folder to install dependencies.
2. Run `npm run dev` (or `node src/server.js`) to start the server on port 4000.
