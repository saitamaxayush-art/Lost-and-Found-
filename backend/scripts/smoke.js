// backend/scripts/smoke.js
// -------------------------------------------------------------
// This is a quick "smoke test" script to verify the backend is working.
// A smoke test checks the critical paths (like turning an engine on to see
// if smoke comes out) before running deeper tests.
//
// It assumes the server is already running on port 4000 (or the PORT from .env).
// It tests:
// 1. Health check (/api/health)
// 2. User login with a brand-new test email (/api/auth/login)
// 3. Authenticated profile lookup (/api/me)
// 4. Updating profile details (/api/me)
// 5. Auth protection on unauthorized requests
//
// Structured in small named check functions so future phases can add more tests.
// -------------------------------------------------------------

import 'dotenv/config';

const PORT = Number(process.env.PORT) || 4000;
const BASE_URL = `http://localhost:${PORT}`;

let passedCount = 0;
let failedCount = 0;

// Helper to record and display test results
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ ${message}`);
    failedCount++;
  }
}

// Check 1: Health endpoint responds with ok: true
async function checkHealth() {
  console.log('\n[1/5] Checking server health...');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200, `Health check returned status ${res.status}`);
    assert(data.ok === true, `Health check returned ok: true`);
  } catch (err) {
    assert(false, `Health check failed to connect: ${err.message}`);
  }
}

// Check 2: Login creates a user and returns a valid JWT token
async function checkLogin(testUser) {
  console.log('\n[2/5] Checking user login & registration...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    assert(res.status === 200, `Login returned status 200`);
    assert(typeof data.token === 'string' && data.token.length > 20, `Returned a JWT token string`);
    assert(data.user && data.user.email === testUser.email.toLowerCase(), `Returned matching user profile`);
    return data.token;
  } catch (err) {
    assert(false, `Login request failed: ${err.message}`);
    return null;
  }
}

// Check 3: GET /api/me loads the profile using the Bearer token
async function checkGetMe(token, expectedEmail) {
  console.log('\n[3/5] Checking GET /api/me with token...');
  try {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    assert(res.status === 200, `GET /api/me returned status 200`);
    assert(data.email === expectedEmail.toLowerCase(), `Profile email matches logged in user`);
    assert(typeof data.points === 'number', `User points is a number (${data.points})`);
  } catch (err) {
    assert(false, `GET /api/me failed: ${err.message}`);
  }
}

// Check 4: PATCH /api/me updates the profile
async function checkPatchMe(token) {
  console.log('\n[4/5] Checking PATCH /api/me...');
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
    assert(data.name === 'Alex Supertester', `Name updated to Alex Supertester`);
    assert(data.campus === 'North Campus', `Campus updated to North Campus`);
  } catch (err) {
    assert(false, `PATCH /api/me failed: ${err.message}`);
  }
}

// Check 5: Requesting /api/me without a token is rejected with 401
async function checkUnauthorized() {
  console.log('\n[5/5] Checking auth protection (unauthorized access)...');
  try {
    const res = await fetch(`${BASE_URL}/api/me`);
    const data = await res.json();
    assert(res.status === 401, `Protected route rejected request without token with 401 (got ${res.status})`);
    assert(typeof data.error === 'string', `Received clear error message: "${data.error}"`);
  } catch (err) {
    assert(false, `Unauthorized check failed: ${err.message}`);
  }
}

// Main execution runner
async function main() {
  console.log(`Starting FindBack backend smoke test against ${BASE_URL}...`);

  const uniqueId = Date.now();
  const testUser = {
    name: 'Smoke Tester',
    email: `smoke_${uniqueId}@campus.edu`,
    whatsapp: '+919876543210',
    campus: 'South Campus',
  };

  await checkHealth();
  const token = await checkLogin(testUser);

  if (token) {
    await checkGetMe(token, testUser.email);
    await checkPatchMe(token);
  } else {
    console.error('Skipping authenticated checks because login failed.');
  }

  await checkUnauthorized();

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
