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
// Main execution runner
// -------------------------------------------------------------
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

  // Run Phase 1 checks
  await checkHealth();
  const tokenA = await checkLogin(userA);

  if (tokenA) {
    await checkGetMe(tokenA, userA.email);
    await checkPatchMe(tokenA);
  }

  await checkUnauthorized();

  // Run Phase 2 checks
  const tokenB = await checkLogin(userB);

  if (tokenA && tokenB) {
    const foundItem = await checkReportFoundItemWithImage(tokenA);
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
