# FindBack — Run & Testing Guide

This guide walks you through installing dependencies, seeding the database, running both frontend and backend servers, and executing two-browser end-to-end testing with pre-seeded demo accounts.

---

## 1. Installation

From the project root:

```bash
# 1. Install root & frontend dependencies
npm install

# 2. Install backend dependencies
cd backend && npm install && cd ..
```

---

## 2. Database Seeding

Before running the app, populate the database with demo users, hero item photos, and 8 months of historical analytics:

```bash
cd backend
npm run seed -- --reset
cd ..
```

*Note: The `--reset` flag clears all existing database tables first so you always begin with clean, consistent demo data.*

---

## 3. Running Both Servers

Open two terminal windows:

### Terminal 1: Backend Server (Port 4000)
```bash
cd backend
npm run dev
```
*Backend runs at: [http://localhost:4000](http://localhost:4000)*

### Terminal 2: Frontend Server (Port 5173)
```bash
npm run dev
```
*Frontend runs at: [http://localhost:5173](http://localhost:5173)*
*(The Vite development server automatically proxies `/api` and `/uploads` requests to `http://localhost:4000`).*

---

## 4. Smoke Test Suite

To verify all 124 backend API checks and security rules in seconds:

```bash
cd backend
npm run smoke
```

---

## 5. Demo Accounts (Password-Free)

FindBack uses password-free, OTP-authenticated sign-in. On the login modal, enter the user's details, click **Continue**, and then click **"Auto-fill demo code"** (or type the 6-digit code shown in the green notification toast).

| Persona | Name | Email | WhatsApp | Campus | Initial Karma |
|---|---|---|---|---|---|
| **Demo Owner** | owner | `ownertest@gmail.com` | `1234567890` | VIT Pune | 80 pts |
| **Demo Founder** | founder | `foundertest@gmail.com` | `9876543210` | VIT Pune | 120 pts |
| **Finder / Helper** | Aditi Sharma | `aditi@demo.findback.test` | `+919876543001` | VIT Pune | 150 pts |
| **Owner / Claimant** | Rohan Verma | `rohan@demo.findback.test` | `+919876543002` | VIT Pune | 100 pts |
| **Student** | Priya Nair | `priya@demo.findback.test` | `+919876543003` | VIT Pune | 50 pts |
| **Student** | Kabir Mehta | `kabir@demo.findback.test` | `+919876543004` | VIT Pune | 50 pts |
| **New Member** | Ananya Sen | `ananya@demo.findback.test` | `+919876543005` | VIT Pune | 0 pts |

---

## 6. Two-Browser Testing Walkthrough

Open **two separate browser windows** (e.g. Chrome normal window and Incognito window):

### Browser 1: Finder (Aditi Sharma)
1. Navigate to [http://localhost:5173](http://localhost:5173).
2. Click **Sign In** and enter:
   - **Name**: `Aditi Sharma`
   - **Email**: `aditi@demo.findback.test`
   - **WhatsApp**: `+919876543001`
   - **Campus**: `North Campus`
3. Click **Auto-fill demo code** -> **Enter Dashboard**.
4. Click **"I found something"** on the landing page:
   - Category: `Electronics`
   - Description: `Black Sony wireless headphones near cafeteria`
   - Location: `Campus Canteen`
   - Attach any sample photo.
5. Click **Submit found report**.

### Browser 2: Owner (Rohan Verma)
1. Navigate to [http://localhost:5173](http://localhost:5173) in Incognito.
2. Sign in as:
   - **Name**: `Rohan Verma`
   - **Email**: `rohan@demo.findback.test`
   - **WhatsApp**: `+919876543002`
   - **Campus**: `South Campus`
3. On the Home search bar, search: `sony headphones cafeteria`.
4. Click the matched item card to open the preview modal.
5. Click **"Request to chat with the finder"**.
6. The app opens `/people?chat=<id>`. Send a message: *"Hi Aditi, I think these headphones are mine!"*.

### Handover & Karma Verification
1. **In Browser 1 (Aditi)**:
   - Go to `/people` (or click notification bell).
   - Reply in the thread: *"Can you describe the scratch on the left earcup?"*.
   - In the right-hand context panel, click the green **"Matched"** button.
2. **In Browser 2 (Rohan)**:
   - Notice the status updates to **"Match Confirmed"**.
   - Direct Contact unlocks: Aditi's WhatsApp (`+919876543001`) and direct WhatsApp button are revealed.
   - Click the green **"Item returned"** button.
3. **Outcome**:
   - Browser 1 (Aditi) earns **+50 karma points** (reflected on `/profile` and campus leaderboard).
   - The headphones disappear from public search on `/` while remaining safely listed in both users' `/profile` history under **"Returned"**.
   - Analytics graph on the Landing page reflects the newly completed reunion.
