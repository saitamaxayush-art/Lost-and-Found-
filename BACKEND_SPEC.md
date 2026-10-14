# FindBack backend spec (single source of truth)

## Stack and rules
- Node.js 20+, Express, better-sqlite3 (file database at backend/data/findback.db), multer for photo upload, jsonwebtoken for login tokens, cors, dotenv. ES modules. No TypeScript, no ORM.
- Server port 4000. The Vite frontend (port 5173) proxies /api and /uploads to it.
- Beginner-friendly code: small files, plain-English comments, clear names.
- Every route validates input and answers JSON. Errors look like { error: 'message' } with the right code (400 bad input, 401 not logged in, 403 not allowed, 404 not found). Never crash on bad input.
- Ids are crypto.randomUUID(). Times are milliseconds (Date.now()). Dates are YYYY-MM-DD text.

## Tables
- users: id, name, email (unique, lowercase), whatsapp, campus, points (default 0), created_at
- items: id, type (lost | found), description, category, location, date, image_path (nullable, like /uploads/abc.jpg), reporter_id, status (reported | matched | returned), created_at, returned_at (nullable)
- conversations: id, found_item_id, lost_item_id (nullable), owner_id (the person who LOST it and asked to chat), finder_id (the person who posted the FOUND item), status (chatting | matched | not_matched | returned | not_returned), created_at, updated_at, matched_at (nullable), closed_at (nullable). Only one conversation per (found_item_id, owner_id).
- messages: id, conversation_id, sender_id (null for system messages), kind (text | system), text, created_at
- feedback: id, conversation_id, user_id, stage (match | return), outcome (matched | not_matched | returned | not_returned), explanation (nullable), created_at
- notifications: id, user_id, type, title, message, link (nullable), read (0 or 1), created_at

## Login
- POST /api/auth/login { name, email, whatsapp, campus } creates the user or, if the email exists, updates their details. Returns { token, user }. Token is a JWT valid 7 days, sent as 'Authorization: Bearer <token>'. No password in this version (the frontend keeps its demo OTP screen).
- GET /api/me returns the user. PATCH /api/me edits name, whatsapp, campus.

## Items
- POST /api/items (login required, multipart form: type, description, category, location, date, optional image file up to 5 MB, jpg/png/webp only). Returns { item, possibleMatches }. For a lost report, possibleMatches = up to 3 non-returned found items sharing at least one meaningful word. For a found report, possibleMatches = [].
- GET /api/items/search?q=&type=&category=&status= (login optional). Splits q into lowercase words, drops words under 3 letters and filler words (the, and, with, near, from, lost, found, have, has, was, for, and similar). Searches description + category + location. Score = how many DIFFERENT query words appear. Keep score >= 1, sort by score then newest. Items with status returned are NEVER returned. Each result carries matchedWords (array) and matchPercent (score divided by number of query words, as 0-100). If q is empty, return the newest items (no matchedWords).
- GET /api/items/mine returns the logged-in user's own reports (all statuses). GET /api/items/:id returns one item.
- Public item shape: { id, type, description, category, location, date, image, status, createdAt, reporterName (first name only), isMine }. NEVER include the reporter's email or whatsapp.

## Conversations and chat
- POST /api/conversations { foundItemId, lostItemId? } (login required). The item must be type found, not returned, and not posted by the requester. If one already exists for this (item, requester) return it. The requester becomes owner; the item's reporter becomes finder. Creates a system message 'Chat started' and a notification for the finder.
- GET /api/conversations lists my conversations (as owner or finder), newest activity first.
- GET /api/conversations/:id returns one (participants only, else 403).
- GET /api/conversations/:id/messages?after=<ms> returns messages newer than after (all if omitted), oldest first. Participants only.
- POST /api/conversations/:id/messages { text } (1-1000 chars). Allowed only while status is chatting or matched. Otherwise 400 'This chat is closed'.
- Conversation shape: { id, status, myRole ('owner' | 'finder'), item: { id, description, category, location, date, image, status }, otherParty: { name, initials, campus?, whatsapp? }, lastMessage: { text, createdAt } | null, createdAt, updatedAt, canDecideMatch, canDecideReturn }. canDecideMatch is true only for the finder while status is chatting. canDecideReturn is true only for the owner while status is matched.
- CONTACT REVEAL RULE: otherParty.whatsapp and otherParty.campus are included ONLY for the owner, and ONLY when status is matched or returned. In every other case they are absent. The owner's contact is never revealed in this version.

## Decisions
- POST /api/conversations/:id/match { decision: 'matched' | 'not_matched', explanation } (finder only, only while status is chatting).
  - matched: conversation -> matched, found item -> matched, matched_at set, system message, notification to owner.
  - not_matched: explanation REQUIRED (at least 15 characters). Conversation -> not_matched (chat becomes read-only), found item stays reported, feedback row saved, system message, notification to owner.
- POST /api/conversations/:id/return { decision: 'returned' | 'not_returned', explanation } (owner only, only while status is matched).
  - returned: conversation -> returned, found item -> returned with returned_at, the owner's linked lost item (if any) -> returned, finder gets +50 points, system message, notification to finder, and every OTHER conversation still chatting on that found item is closed with a system message.
  - not_returned: explanation REQUIRED (at least 15 characters). Conversation -> not_returned (read-only), found item goes back to reported so it is browsable again, feedback row saved, system message, notification to finder.
- Every decision writes a feedback row, and runs inside one database transaction.

## Stats, points, notifications
- GET /api/stats (public) returns { totals: { reported, returned, successRate, avgDaysToReturn }, monthly: [ { m: 'Oct', reported, returned } ] } for the last 8 months, calculated from the items table (reported by created_at month, returned by returned_at month).
- GET /api/leaderboard returns the top 10 users by points: { name, campus, points }.
- GET /api/notifications returns mine, newest first. POST /api/notifications/read-all marks mine read.
