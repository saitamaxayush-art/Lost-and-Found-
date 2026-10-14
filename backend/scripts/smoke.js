// backend/scripts/smoke.js
// -------------------------------------------------------------
// This is our automated smoke test suite for the FindBack backend.
// It verifies that all core functionality is working end-to-end:
//
// Phase 1 tests:
// 1. Server health check (/api/health)
// 2. User registration & login (/api/auth/login)
// 3. User profile fetching (/api/me)
// 4. User profile editing (/api/me)
// 5. Auth protection against unauthorized requests
//
// Phase 2 tests:
// 6. User A reports a found item with a real generated image
// 7. Verify the uploaded photo actually exists on disk in backend/uploads
// 8. User B searches "black leather wallet near library" and gets matching results
//    with matchedWords and matchPercent
// 9. User B reports a lost item and receives possibleMatches
// 10. Uploading invalid file types (e.g. .txt) is rejected with 400
// 11. Security check: Item responses NEVER leak reporter email or whatsapp
// 12. Returned items are NEVER returned in search results
// -------------------------------------------------------------

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const PORT = Number(process.env.PORT) || 4000;
const BASE_URL = `http://localhost:${PORT}`;

let passedCount = 0;
let failedCount = 0;

// Helper to record and display test assertions
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ ${message}`);
    failedCount++;
  }
}

// -------------------------------------------------------------
// Phase 1 Checks: Auth, Server, Profile
// -------------------------------------------------------------

async function checkHealth() {
  console.log('\n[1/12] Checking server health...');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200, `Health check returned status 200`);
    assert(data.ok === true, `Health check returned ok: true`);
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }
}

async function checkLogin(userPayload) {
  console.log(`\n[2/12] Logging in user (${userPayload.name})...`);
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload),
    });
    const data = await res.json();
    assert(res.status === 200, `Login returned status 200`);
    assert(typeof data.token === 'string' && data.token.length > 20, `Returned a JWT token string`);
    assert(data.user && data.user.email === userPayload.email.toLowerCase(), `Returned matching user profile`);
    return data.token;
  } catch (err) {
    assert(false, `Login failed: ${err.message}`);
    return null;
  }
}

async function checkGetMe(token, expectedEmail) {
  console.log('\n[3/12] Checking GET /api/me with token...');
  try {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    assert(res.status === 200, `GET /api/me returned status 200`);
    assert(data.email === expectedEmail.toLowerCase(), `Profile email matches`);
    assert(typeof data.points === 'number', `User points is a number (${data.points})`);
  } catch (err) {
    assert(false, `GET /api/me failed: ${err.message}`);
  }
}

async function checkPatchMe(token) {
  console.log('\n[4/12] Checking PATCH /api/me...');
  try {
    const res = await fetch(`${BASE_URL}/api/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Alex Supertester', campus: 'North Campus' }),
    });
    const data = await res.json();
    assert(res.status === 200, `PATCH /api/me returned status 200`);
    assert(data.name === 'Alex Supertester', `Name updated`);
    assert(data.campus === 'North Campus', `Campus updated`);
  } catch (err) {
    assert(false, `PATCH /api/me failed: ${err.message}`);
  }
}

async function checkUnauthorized() {
  console.log('\n[5/12] Checking auth protection (unauthorized access)...');
  try {
    const res = await fetch(`${BASE_URL}/api/me`);
    const data = await res.json();
    assert(res.status === 401, `Protected route rejected request without token with 401`);
    assert(typeof data.error === 'string', `Received error message: "${data.error}"`);
  } catch (err) {
    assert(false, `Unauthorized check failed: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Phase 2 Checks: Items, Photo Upload, Search, Possible Matches
// -------------------------------------------------------------

// Check 6 & 7: User A reports found item with an image, verify file on disk
async function checkReportFoundItemWithImage(tokenA) {
  console.log('\n[6/12] User A reports found item with an image upload...');
  let createdItem = null;

  try {
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('description', 'Black leather wallet found on the study desk near library entrance');
    formData.append('category', 'Wallets & Bags');
    formData.append('location', 'Central Campus Library');
    formData.append('date', '2026-10-14');

    // Tiny 1x1 valid PNG image buffer
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    const imageBlob = new Blob([pngBytes], { type: 'image/png' });
    formData.append('image', imageBlob, 'wallet_test.png');

    const res = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });

    const data = await res.json();
    assert(res.status === 201 || res.status === 200, `POST /api/items returned success status (${res.status})`);
    assert(data.item && data.item.type === 'found', `Item created with type 'found'`);
    assert(data.item.reporterName === 'Alex', `Reporter name is first name only ('${data.item.reporterName}')`);
    assert(Array.isArray(data.possibleMatches) && data.possibleMatches.length === 0, `Found report returns empty possibleMatches: []`);
    assert(typeof data.item.image === 'string' && data.item.image.startsWith('/uploads/'), `Image URL path is /uploads/... (${data.item.image})`);

    createdItem = data.item;

    console.log('\n[7/12] Verifying uploaded image really exists on disk in backend/uploads...');
    if (createdItem && createdItem.image) {
      const filename = path.basename(createdItem.image);
      const filePath = path.join(uploadsDir, filename);
      const exists = fs.existsSync(filePath);
      assert(exists, `Uploaded photo file exists at: ${filePath}`);
    } else {
      assert(false, `No image URL returned to verify on disk`);
    }

    return createdItem;
  } catch (err) {
    assert(false, `Report found item failed: ${err.message}`);
    return null;
  }
}

// Check 8: User B searches "black leather wallet near library"
async function checkSearchFoundItem(tokenB, foundItemId) {
  console.log('\n[8/12] User B searches "black leather wallet near library"...');
  try {
    const query = encodeURIComponent('black leather wallet near library');
    const res = await fetch(`${BASE_URL}/api/items/search?q=${query}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const data = await res.json();

    assert(res.status === 200, `Search returned status 200`);
    assert(Array.isArray(data) && data.length > 0, `Search returned matching items (found ${data.length})`);

    const match = data.find(item => item.id === foundItemId);
    assert(Boolean(match), `Search results contain the reported found item`);

    if (match) {
      assert(Array.isArray(match.matchedWords) && match.matchedWords.length >= 3, `Matched words returned: [${match.matchedWords.join(', ')}]`);
      assert(typeof match.matchPercent === 'number' && match.matchPercent > 0, `Match percentage calculated: ${match.matchPercent}%`);
    }
  } catch (err) {
    assert(false, `Search check failed: ${err.message}`);
  }
}

// Check 9: User B reports a lost item and gets possibleMatches
async function checkReportLostItemWithPossibleMatches(tokenB, foundItemId) {
  console.log('\n[9/12] User B reports a lost item and gets possibleMatches...');
  try {
    const formData = new FormData();
    formData.append('type', 'lost');
    formData.append('description', 'Lost black leather wallet containing campus card');
    formData.append('category', 'Wallets & Bags');
    formData.append('location', 'Library');
    formData.append('date', '2026-10-14');

    const res = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: formData,
    });

    const data = await res.json();
    assert(res.status === 201 || res.status === 200, `POST /api/items (lost) returned status ${res.status}`);
    assert(Array.isArray(data.possibleMatches), `Returned possibleMatches array`);
    assert(data.possibleMatches.length >= 1, `Received at least 1 possible match (got ${data.possibleMatches.length})`);

    const hasMatch = data.possibleMatches.some(m => m.id === foundItemId);
    assert(hasMatch, `Possible matches includes User A's found wallet`);

    return data.item;
  } catch (err) {
    assert(false, `Report lost item check failed: ${err.message}`);
    return null;
  }
}

// Check 10: Reject bad file type with 400
async function checkBadFileUpload(tokenB) {
  console.log('\n[10/12] Checking that bad file types (.txt) are rejected with 400...');
  try {
    const formData = new FormData();
    formData.append('type', 'lost');
    formData.append('description', 'Test item with invalid text file attachment');
    formData.append('category', 'Books');
    formData.append('location', 'Hostel');
    formData.append('date', '2026-10-14');

    const badFile = new Blob(['this is plain text not an image'], { type: 'text/plain' });
    formData.append('image', badFile, 'malicious.txt');

    const res = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: formData,
    });

    const data = await res.json();
    assert(res.status === 400, `Rejected bad file type with status 400 (got ${res.status})`);
    assert(typeof data.error === 'string', `Friendly JSON error message returned: "${data.error}"`);
  } catch (err) {
    assert(false, `Bad file type check failed: ${err.message}`);
  }
}

// Check 11: Security check - item JSON responses NEVER leak email or whatsapp
async function checkPrivacyNoContactLeaks(tokenB) {
  console.log('\n[11/12] Privacy Check: Ensuring item responses NEVER leak reporter email or whatsapp...');
  try {
    const res = await fetch(`${BASE_URL}/api/items/search?q=wallet`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const rawText = await res.text();

    const leaksEmail = /"email"\s*:/i.test(rawText);
    const leaksWhatsapp = /"whatsapp"\s*:/i.test(rawText);

    assert(!leaksEmail, `No 'email' property present anywhere in items response JSON`);
    assert(!leaksWhatsapp, `No 'whatsapp' property present anywhere in items response JSON`);
  } catch (err) {
    assert(false, `Privacy check failed: ${err.message}`);
  }
}

// Check 12: Verify GET /api/items/mine and GET /api/items/:id
async function checkItemLookupAndMine(tokenA, foundItemId) {
  console.log('\n[12/14] Checking GET /api/items/mine and GET /api/items/:id...');
  try {
    // 1. Single item lookup
    const singleRes = await fetch(`${BASE_URL}/api/items/${foundItemId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const singleData = await singleRes.json();
    assert(singleRes.status === 200, `GET /api/items/:id returned status 200`);
    assert(singleData.id === foundItemId, `Retrieved correct item by ID`);
    assert(singleData.isMine === true, `isMine is true for the item's reporter`);

    // 2. Mine items list
    const mineRes = await fetch(`${BASE_URL}/api/items/mine`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const mineData = await mineRes.json();
    assert(mineRes.status === 200, `GET /api/items/mine returned status 200`);
    assert(Array.isArray(mineData) && mineData.some(i => i.id === foundItemId), `GET /api/items/mine contains reporter's item`);
  } catch (err) {
    assert(false, `Item lookup or mine check failed: ${err.message}`);
  }
}

// Check 13: Returned items must NEVER appear in search results
async function checkReturnedItemsExcluded(tokenA, tokenB) {
  console.log('\n[13/14] Ensuring returned items NEVER appear in search results...');
  try {
    // 1. Report a found item that will be marked as returned
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('description', 'Scientific calculator casio fx-991ex');
    formData.append('category', 'Electronics');
    formData.append('location', 'Science Block Room 101');
    formData.append('date', '2026-10-14');

    const createRes = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const createData = await createRes.json();
    const calculatorItemId = createData.item.id;

    // Direct database update to simulate item being returned (Phase 3 handles the full claim decision)
    // Import db lazily to update status for this test
    const { default: db } = await import('../src/db.js');
    db.prepare(`UPDATE items SET status = 'returned', returned_at = ? WHERE id = ?`).run(Date.now(), calculatorItemId);

    // Search for the calculator
    const searchRes = await fetch(`${BASE_URL}/api/items/search?q=calculator`);
    const searchData = await searchRes.json();

    const returnedItemFound = searchData.some(item => item.id === calculatorItemId);
    assert(!returnedItemFound, `Item with status 'returned' is completely excluded from search results`);
  } catch (err) {
    assert(false, `Returned items exclusion check failed: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Phase 3 Checks: Conversations, Messaging, Privacy & Auth
// -------------------------------------------------------------

// Check 14: User A cannot start a chat on their own found item
async function checkCannotChatOnOwnItem(tokenA, foundItemId) {
  console.log('\n[14/20] Checking user cannot request chat on own item...');
  try {
    const res = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ foundItemId }),
    });
    const data = await res.json();
    assert(res.status === 400, `Rejected chat request on own item with status 400 (got ${res.status})`);
    assert(typeof data.error === 'string', `Received clear error message: "${data.error}"`);
  } catch (err) {
    assert(false, `Own item chat rejection check failed: ${err.message}`);
  }
}

// Check 15, 16, 17, 18: User B requests chat on User A's found item
async function checkCreateConversation(tokenB, tokenA, foundItemId, userA_id) {
  console.log('\n[15/20] User B requests chat on User A\'s found item...');
  try {
    const res = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ foundItemId }),
    });
    const conv = await res.json();

    assert(res.status === 201 || res.status === 200, `POST /api/conversations returned success status (${res.status})`);
    assert(conv && conv.status === 'chatting', `Conversation status is 'chatting'`);
    assert(conv.myRole === 'owner', `User B's role is 'owner'`);
    assert(conv.canDecideMatch === false, `canDecideMatch is false for owner while chatting`);
    assert(conv.canDecideReturn === false, `canDecideReturn is false while chatting`);
    assert(conv.lastMessage && conv.lastMessage.text === 'Chat started', `System message 'Chat started' recorded as last message`);

    console.log('\n[16/20] Checking conversation otherParty details and contact privacy...');
    assert(conv.otherParty && conv.otherParty.name === 'Alex Supertester', `otherParty name is 'Alex Supertester'`);
    assert(conv.otherParty.initials === 'AS', `otherParty initials correctly computed as 'AS'`);

    // PRIVACY / CONTACT REVEAL RULE:
    assert(conv.otherParty.whatsapp === undefined, `otherParty has NO whatsapp for B while chatting`);
    assert(conv.otherParty.campus === undefined, `otherParty has NO campus for B while chatting`);

    console.log('\n[17/20] Verifying notification for finder (User A) was recorded...');
    const { default: db } = await import('../src/db.js');
    const notif = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ? AND type = 'claim'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userA_id);

    assert(Boolean(notif), `Notification exists for finder User A`);
    if (notif) {
      assert(notif.link === `/people?chat=${conv.id}`, `Notification link matches /people?chat=${conv.id}`);
      assert(notif.title === 'New Claim Request', `Notification title is 'New Claim Request'`);
    }

    return conv;
  } catch (err) {
    assert(false, `Create conversation failed: ${err.message}`);
    return null;
  }
}

// Check 19: Third user C gets 403 when trying to access the conversation
async function checkThirdPartyAccessForbidden(tokenC, convId) {
  console.log('\n[18/20] Checking third user C gets 403 when accessing private conversation...');
  try {
    // 1. Reading conversation details
    const convRes = await fetch(`${BASE_URL}/api/conversations/${convId}`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    const convData = await convRes.json();
    assert(convRes.status === 403, `GET /api/conversations/:id returned 403 for non-participant (got ${convRes.status})`);
    assert(typeof convData.error === 'string', `Received forbidden error: "${convData.error}"`);

    // 2. Reading messages
    const msgRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(msgRes.status === 403, `GET /api/conversations/:id/messages returned 403 for non-participant`);

    // 3. Posting messages
    const postRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`,
      },
      body: JSON.stringify({ text: 'I am spying on you' }),
    });
    assert(postRes.status === 403, `POST /api/conversations/:id/messages returned 403 for non-participant`);
  } catch (err) {
    assert(false, `Third party access check failed: ${err.message}`);
  }
}

// Check 20: A and B exchange messages; 'after' filter returns only new ones
async function checkMessageExchangeAndAfterFilter(tokenA, tokenB, convId) {
  console.log('\n[19/20] User B and User A exchange messages in claim chat...');
  try {
    // 1. User B sends message
    const msg1Res = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ text: 'Hi! I lost my black leather wallet near the library entrance.' }),
    });
    const msg1 = await msg1Res.json();
    assert(msg1Res.status === 201, `User B sent message (status 201)`);
    assert(msg1.text.includes('black leather wallet'), `Message text matches`);
    assert(msg1.isMine === true, `isMine is true for sender B`);

    const cutoffTimestamp = msg1.createdAt;
    // Small delay to ensure timestamp progression
    await new Promise(r => setTimeout(r, 10));

    // 2. User A replies
    const msg2Res = await fetch(`${BASE_URL}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ text: 'Hello! Does your wallet contain a student ID card?' }),
    });
    const msg2 = await msg2Res.json();
    assert(msg2Res.status === 201, `User A sent reply (status 201)`);
    assert(msg2.text.includes('student ID card'), `Reply text matches`);

    console.log('\n[20/20] Testing ?after=<ms> filter on messages endpoint...');
    // 3. Fetch messages with ?after=cutoffTimestamp
    const filteredRes = await fetch(`${BASE_URL}/api/conversations/${convId}/messages?after=${cutoffTimestamp}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const filteredMessages = await filteredRes.json();

    assert(filteredRes.status === 200, `GET messages?after= returned status 200`);
    assert(Array.isArray(filteredMessages), `Returned array of messages`);
    assert(filteredMessages.length === 1, `Filter ?after= returned only the 1 newer message (got ${filteredMessages.length})`);
    if (filteredMessages.length > 0) {
      assert(filteredMessages[0].id === msg2.id, `The filtered message is User A's latest reply`);
    }

    // 4. Verify conversation updated_at updated
    const convRes = await fetch(`${BASE_URL}/api/conversations/${convId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const convData = await convRes.json();
    assert(convData.updatedAt >= msg2.createdAt, `Conversation updated_at reflects newest message timestamp`);
  } catch (err) {
    assert(false, `Message exchange and filter check failed: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Phase 4 Checks: The Decision Flow (Match & Return Decisions)
// -------------------------------------------------------------

async function checkPhase4Decisions(tokenA, tokenB, tokenC, tokenD, userA, userD, conv1) {
  console.log('\n[21/28] Phase 4: Checking role restrictions on /match (owner B cannot call /match)...');
  try {
    const res = await fetch(`${BASE_URL}/api/conversations/${conv1.id}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ decision: 'matched' }),
    });
    const data = await res.json();
    assert(res.status === 403, `Owner B rejected with 403 when trying to call /match (got ${res.status})`);
    assert(typeof data.error === 'string', `Received forbidden error: "${data.error}"`);
  } catch (err) {
    assert(false, `Owner /match rejection check failed: ${err.message}`);
  }

  console.log('\n[22/28] Phase 4: Finder A calls not_matched (explanation required)...');
  try {
    // 1. Without explanation -> 400
    const noExpRes = await fetch(`${BASE_URL}/api/conversations/${conv1.id}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ decision: 'not_matched' }),
    });
    const noExpData = await noExpRes.json();
    assert(noExpRes.status === 400, `not_matched without explanation rejected with 400`);
    assert(noExpData.error.includes('15 characters'), `Error message requires 15 characters`);

    // 2. With valid explanation (>= 15 chars) -> 200
    const explanation = 'The serial numbers provided do not match what I found on the desk.';
    const validRes = await fetch(`${BASE_URL}/api/conversations/${conv1.id}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ decision: 'not_matched', explanation }),
    });
    const validConv = await validRes.json();
    assert(validRes.status === 200, `not_matched with explanation returned status 200`);
    assert(validConv.status === 'not_matched', `Conversation status is 'not_matched'`);

    // 3. Chat is now read-only
    const closedMsgRes = await fetch(`${BASE_URL}/api/conversations/${conv1.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ text: 'Can we try again?' }),
    });
    assert(closedMsgRes.status === 400, `Posting to closed chat rejected with 400 'This chat is closed'`);

    // 4. Feedback row saved
    const { default: db } = await import('../src/db.js');
    const fb = db.prepare('SELECT * FROM feedback WHERE conversation_id = ? AND stage = ?').get(conv1.id, 'match');
    assert(Boolean(fb), `Feedback row saved in database`);
    assert(fb && fb.outcome === 'not_matched' && fb.explanation === explanation, `Feedback outcome and explanation match`);
  } catch (err) {
    assert(false, `Finder not_matched check failed: ${err.message}`);
  }

  console.log('\n[23/28] Phase 4: Owner D starts chat on Item 2, Finder A confirms match...');
  let conv2 = null;
  let item2 = null;
  try {
    // 1. Finder A reports Item 2
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('description', 'Stainless steel blue water bottle found in sports complex gym');
    formData.append('category', 'Accessories');
    formData.append('location', 'Sports Complex');
    formData.append('date', '2026-10-14');

    const itemRes = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const itemData = await itemRes.json();
    item2 = itemData.item;

    // 2. Owner D requests chat on Item 2
    const convRes = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenD}`,
      },
      body: JSON.stringify({ foundItemId: item2.id }),
    });
    conv2 = await convRes.json();
    assert(convRes.status === 201, `Owner D started chat on Item 2 (status 201)`);

    // 3. Finder A confirms match
    const matchRes = await fetch(`${BASE_URL}/api/conversations/${conv2.id}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ decision: 'matched' }),
    });
    assert(matchRes.status === 200, `Finder A matched Item 2 (status 200)`);
  } catch (err) {
    assert(false, `Match confirmation setup failed: ${err.message}`);
  }

  console.log('\n[24/28] Phase 4: CONTACT REVEAL RULE: Owner D now SEES A\'s WhatsApp & campus...');
  try {
    // 1. Owner D fetches conversation
    const getRes = await fetch(`${BASE_URL}/api/conversations/${conv2.id}`, {
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    const dView = await getRes.json();
    assert(dView.status === 'matched', `Conversation status is 'matched'`);
    assert(dView.otherParty && dView.otherParty.whatsapp === userA.whatsapp, `Owner D now sees Finder A's WhatsApp (${dView.otherParty.whatsapp})`);
    assert(dView.otherParty && dView.otherParty.campus === userA.campus, `Owner D now sees Finder A's Campus (${dView.otherParty.campus})`);
    assert(dView.canDecideReturn === true, `canDecideReturn is now true for Owner D`);

    // 2. Third user C still gets 403
    const cRes = await fetch(`${BASE_URL}/api/conversations/${conv2.id}`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(cRes.status === 403, `Third user C is strictly forbidden (status 403)`);

    // 3. Finder A viewing does NOT see Owner D's contact info
    const aRes = await fetch(`${BASE_URL}/api/conversations/${conv2.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const aView = await aRes.json();
    assert(aView.otherParty.whatsapp === undefined, `Finder A still cannot see Owner D's WhatsApp (contact privacy)`);
  } catch (err) {
    assert(false, `Contact reveal check failed: ${err.message}`);
  }

  console.log('\n[25/28] Phase 4: Owner D says not_returned (explanation required & item restored)...');
  try {
    // 1. Without explanation -> 400
    const noExpRes = await fetch(`${BASE_URL}/api/conversations/${conv2.id}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenD}`,
      },
      body: JSON.stringify({ decision: 'not_returned' }),
    });
    assert(noExpRes.status === 400, `not_returned without explanation rejected with 400`);

    // 2. With explanation -> 200
    const expText = 'We met at the cafeteria but the water bottle was a different brand.';
    const validRes = await fetch(`${BASE_URL}/api/conversations/${conv2.id}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenD}`,
      },
      body: JSON.stringify({ decision: 'not_returned', explanation: expText }),
    });
    const returnedConv = await validRes.json();
    assert(validRes.status === 200, `not_returned with explanation returned status 200`);
    assert(returnedConv.status === 'not_returned', `Conversation status updated to 'not_returned'`);

    // 3. Item is browsable again in search
    const searchRes = await fetch(`${BASE_URL}/api/items/search?q=bottle`);
    const searchData = await searchRes.json();
    const itemFound = searchData.some(i => i.id === item2.id);
    assert(itemFound, `Found item status went back to 'reported' and is browsable again`);

    // 4. Feedback row exists
    const { default: db } = await import('../src/db.js');
    const fb = db.prepare('SELECT * FROM feedback WHERE conversation_id = ? AND stage = ?').get(conv2.id, 'return');
    assert(Boolean(fb) && fb.outcome === 'not_returned', `Feedback row recorded with outcome 'not_returned'`);
  } catch (err) {
    assert(false, `Owner not_returned check failed: ${err.message}`);
  }

  console.log('\n[26/28] Phase 4: Fresh chat where Owner confirms return (+50 points to finder)...');
  try {
    // 1. Finder A reports Item 3
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('description', 'Sony WH-1000XM5 wireless noise cancelling headphones black');
    formData.append('category', 'Electronics');
    formData.append('location', 'Auditorium Hall B');
    formData.append('date', '2026-10-14');

    const item3Res = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const item3 = (await item3Res.json()).item;

    // 2. Owner D requests chat on Item 3
    const conv3Res = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenD}`,
      },
      body: JSON.stringify({ foundItemId: item3.id }),
    });
    const conv3 = await conv3Res.json();

    // 3. Finder A confirms match
    await fetch(`${BASE_URL}/api/conversations/${conv3.id}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ decision: 'matched' }),
    });

    // Record Finder A points before return
    const aBefore = await (await fetch(`${BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${tokenA}` } })).json();

    // 4. Owner D confirms returned
    const returnRes = await fetch(`${BASE_URL}/api/conversations/${conv3.id}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenD}`,
      },
      body: JSON.stringify({ decision: 'returned' }),
    });
    const finalConv = await returnRes.json();
    assert(returnRes.status === 200, `Owner return confirmation returned status 200`);
    assert(finalConv.status === 'returned', `Conversation status is 'returned'`);

    console.log('\n[27/28] Verifying item disappears from search but stays in /mine...');
    // Item missing from search
    const searchRes = await fetch(`${BASE_URL}/api/items/search?q=headphones`);
    const searchData = await searchRes.json();
    const inSearch = searchData.some(i => i.id === item3.id);
    assert(!inSearch, `Returned item is absent from search results`);

    // Item still in /api/items/mine
    const mineRes = await fetch(`${BASE_URL}/api/items/mine`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const mineData = await mineRes.json();
    const inMine = mineData.find(i => i.id === item3.id);
    assert(Boolean(inMine), `Item still appears in reporter's /api/items/mine`);
    assert(inMine && inMine.status === 'returned', `Item status in /api/items/mine is 'returned'`);

    console.log('\n[28/28] Verifying Finder A received +50 points...');
    const aAfter = await (await fetch(`${BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${tokenA}` } })).json();
    assert(aAfter.points === aBefore.points + 50, `Finder A points increased by 50 (${aBefore.points} -> ${aAfter.points})`);

    // Feedback row saved
    const { default: db } = await import('../src/db.js');
    const fb = db.prepare('SELECT * FROM feedback WHERE conversation_id = ? AND stage = ?').get(conv3.id, 'return');
    assert(Boolean(fb) && fb.outcome === 'returned', `Feedback row recorded with outcome 'returned'`);
  } catch (err) {
    assert(false, `Owner return confirmation check failed: ${err.message}`);
  }
}
async function main() {
  console.log(`Starting FindBack backend smoke test against ${BASE_URL}...`);

  const uniqueId = Date.now();
  const userA = {
    name: 'Alex Supertester',
    email: `alex_${uniqueId}@campus.edu`,
    whatsapp: '+919876543210',
    campus: 'North Campus',
  };

  const userB = {
    name: 'Jordan Finder',
    email: `jordan_${uniqueId}@campus.edu`,
    whatsapp: '+919876543211',
    campus: 'South Campus',
  };

  const userC = {
    name: 'Charlie Outsider',
    email: `charlie_${uniqueId}@campus.edu`,
    whatsapp: '+919876543212',
    campus: 'West Campus',
  };

  // Run Phase 1 checks
  await checkHealth();
  const tokenA = await checkLogin(userA);

  let userA_id = null;
  if (tokenA) {
    await checkGetMe(tokenA, userA.email);
    await checkPatchMe(tokenA);
    const meRes = await fetch(`${BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const meData = await meRes.json();
    userA_id = meData.id;
  }

  await checkUnauthorized();

  // Run Phase 2 checks
  const tokenB = await checkLogin(userB);

  let foundItem = null;
  if (tokenA && tokenB) {
    foundItem = await checkReportFoundItemWithImage(tokenA);
    if (foundItem) {
      await checkSearchFoundItem(tokenB, foundItem.id);
      await checkReportLostItemWithPossibleMatches(tokenB, foundItem.id);
      await checkItemLookupAndMine(tokenA, foundItem.id);
    }
    await checkBadFileUpload(tokenB);
    await checkPrivacyNoContactLeaks(tokenB);
    await checkReturnedItemsExcluded(tokenA, tokenB);
  } else {
    console.error('Skipping Phase 2 tests because user login failed.');
  }

  // Run Phase 3 checks
  const tokenC = await checkLogin(userC);

  let conv = null;
  if (tokenA && tokenB && tokenC && foundItem) {
    await checkCannotChatOnOwnItem(tokenA, foundItem.id);
    conv = await checkCreateConversation(tokenB, tokenA, foundItem.id, userA_id);
    if (conv) {
      await checkThirdPartyAccessForbidden(tokenC, conv.id);
      await checkMessageExchangeAndAfterFilter(tokenA, tokenB, conv.id);
    }
  } else {
    console.error('Skipping Phase 3 tests because prerequisites were not met.');
  }

  // Run Phase 4 checks
  const userD = {
    name: 'Devin Student',
    email: `devin_${uniqueId}@campus.edu`,
    whatsapp: '+919876543213',
    campus: 'East Campus',
  };
  const tokenD = await checkLogin(userD);

  if (tokenA && tokenB && tokenC && tokenD && conv) {
    await checkPhase4Decisions(tokenA, tokenB, tokenC, tokenD, userA, userD, conv);
  } else {
    console.error('Skipping Phase 4 tests because prerequisites were not met.');
  }

  console.log('\n----------------------------------------');
  console.log(`Smoke test completed: ${passedCount} passed, ${failedCount} failed.`);
  console.log('----------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected smoke test failure:', err);
  process.exit(1);
});
