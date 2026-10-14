# FindBack Backend

This backend is a lightweight Node.js & Express REST API that powers FindBack, a campus Lost & Found platform.
It uses SQLite (via `better-sqlite3`) in WAL mode to reliably manage users, lost/found item reports, private claim chats, notifications, karma points, and recovery analytics.

---

### Folder Layout
- `src/server.js` - Express application entry point (listens on port 4000).
- `src/db.js` - SQLite connection, schema initialization, and pragmas (`WAL` mode + `busy_timeout = 5000`).
- `src/routes/` - Route handlers for authentication (`auth.js`), items (`items.js`), conversations & messaging (`conversations.js`), karma leaderboard & analytics (`stats.js`), and user notifications (`notifications.js`).
- `src/middleware/` - Auth verification (`requireAuth`, `optionalAuth`) and photo upload validation (`multer`).
- `src/lib/` - Keyword matching engine (`matching.js`) and conversation serializer (`formatConversation.js`).
- `scripts/` - Automated database seeding (`seed.js`) and 124-point smoke test suite (`smoke.js`).
- `data/` - Storage location for the SQLite database file (`findback.db`).
- `uploads/` - Storage directory for uploaded item photos (served at `/uploads`).

---

### Quick Setup & Commands

All commands below are run from the `backend/` directory:
```bash
cd backend
```

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Seed the Database (Required on First Run)**
   ```bash
   # Populate realistic demo users, sample items, and 8-month historical analytics:
   npm run seed

   # Or completely reset and reseed from scratch:
   npm run seed -- --reset
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *Runs with `--watch` on [http://localhost:4000](http://localhost:4000).*

4. **Run End-to-End Smoke Tests**
   *(Ensure the backend server is running in another terminal)*
   ```bash
   npm run smoke
   ```
   *Runs 124 automated assertions covering authentication, item uploads, search, messaging, contact privacy, match/return flows, karma points, and stats.*

---

### Pre-Seeded Demo Accounts for Testing

FindBack uses password-free, OTP-authenticated sign-in. You can enter any of the pre-seeded accounts below, or input any new email address.

| Role | Name | Email | WhatsApp | Campus | Initial Points |
|---|---|---|---|---|---|
| **Finder / Helper** | Aditi Sharma | `aditi@demo.findback.test` | `+919876543001` | North Campus | 150 pts |
| **Owner / Claimant** | Rohan Verma | `rohan@demo.findback.test` | `+919876543002` | South Campus | 100 pts |
| **Student** | Priya Nair | `priya@demo.findback.test` | `+919876543003` | East Campus | 50 pts |
| **Student** | Kabir Mehta | `kabir@demo.findback.test` | `+919876543004` | West Campus | 50 pts |
| **New Member** | Ananya Sen | `ananya@demo.findback.test` | `+919876543005` | Central Campus | 0 pts |

---

### Two-Browser End-to-End Walkthrough

For manual testing, open two separate browser windows (or one standard and one incognito):

1. **Browser A (Finder - Aditi Sharma)**:
   - Sign in as `aditi@demo.findback.test` (use "Auto-fill OTP" on step 2).
   - Click **"I found something"** and upload an item photo (e.g. calculator, wallet, or bottle).
   - Submit the found report.

2. **Browser B (Owner - Rohan Verma)**:
   - Sign in as `rohan@demo.findback.test`.
   - On the Home page, search by words for the item reported in Browser A.
   - Click the item card -> Click **"Request to chat with the finder"**.
   - Exchange messages in the People chat.

3. **Handover & Return Confirmation**:
   - In Browser A (Finder), click **"Matched"** in the right-hand context panel.
   - In Browser B (Owner), notice that Aditi's WhatsApp contact and direct link unlocked!
   - In Browser B (Owner), click **"Item returned"**.
   - Finder earns **+50 karma points**, the item is marked **Returned**, and disappears from public search while remaining visible in both users' profiles.
