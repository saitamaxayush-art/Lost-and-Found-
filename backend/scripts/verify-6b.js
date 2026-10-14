// backend/scripts/verify-6b.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VITE_URL = 'http://localhost:5173';

async function runVerification() {
  console.log('--- Step 5 Verification: End-to-End Test ---');

  // 1. User A logs in through Vite proxy
  const userARes = await fetch(`${VITE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Finder',
      email: 'rohan.finder@demo.findback.test',
      whatsapp: '+919123456789',
      campus: 'North Campus',
    }),
  });
  if (!userARes.ok) throw new Error(`User A login failed: ${userARes.status}`);
  const userAData = await userARes.json();
  const tokenA = userAData.token;
  console.log('✅ 1a. User A logged in successfully:', userAData.user.name);

  // 1b. User A reports a found item with a photo
  const testImagePath = path.join(__dirname, 'test-photo.png');
  // 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  fs.writeFileSync(testImagePath, pngBuffer);

  const formData = new FormData();
  formData.append('type', 'found');
  formData.append('description', 'Silver stainless steel water bottle with blue cap');
  formData.append('category', 'Other');
  formData.append('location', 'Physics Lab Room 204');
  formData.append('date', new Date().toISOString().slice(0, 10));
  formData.append('image', new Blob([pngBuffer], { type: 'image/png' }), 'water-bottle.png');

  const reportRes = await fetch(`${VITE_URL}/api/items`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: formData,
  });

  if (!reportRes.ok) {
    const errText = await reportRes.text();
    throw new Error(`Report item failed: ${reportRes.status} ${errText}`);
  }
  const reportData = await reportRes.json();
  const createdItem = reportData.item;
  console.log('✅ 1b. Reported found item with photo:', createdItem.id, 'Image path:', createdItem.image);

  // Verify in SQLite database
  const dbRow = db.prepare('SELECT * FROM items WHERE id = ?').get(createdItem.id);
  if (!dbRow) throw new Error('Item not found in SQLite items table!');
  if (!dbRow.image_path) throw new Error('Item in DB has null image_path!');
  console.log('✅ 1c. DB items table has row with image_path:', dbRow.image_path);

  // Verify image file on disk in backend/uploads
  const diskPath = path.resolve(__dirname, '..', dbRow.image_path.replace(/^\//, ''));
  if (!fs.existsSync(diskPath)) throw new Error(`File missing on disk at ${diskPath}`);
  console.log('✅ 1d. Physical file confirmed on disk at:', diskPath);

  // Verify image served through Vite proxy
  const imgRes = await fetch(`${VITE_URL}${dbRow.image_path}`);
  if (!imgRes.ok) throw new Error(`Image proxy fetch failed: ${imgRes.status}`);
  console.log('✅ 1e. Image served through Vite proxy with status:', imgRes.status, 'Content-Type:', imgRes.headers.get('content-type'));

  // 2. User B searches words from the item
  const userBRes = await fetch(`${VITE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Owner',
      email: 'priya.owner@demo.findback.test',
      whatsapp: '+919988776655',
      campus: 'North Campus',
    }),
  });
  if (!userBRes.ok) throw new Error(`User B login failed: ${userBRes.status}`);
  const userBData = await userBRes.json();
  const tokenB = userBData.token;
  console.log('✅ 2a. User B logged in successfully:', userBData.user.name);

  // Search words: "stainless steel water bottle blue"
  const searchUrl = `${VITE_URL}/api/items/search?q=stainless+steel+water+bottle+blue&type=found`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status}`);
  const searchResults = await searchRes.json();
  const matchedItem = searchResults.find(i => i.id === createdItem.id);
  if (!matchedItem) throw new Error('Search did not return the reported item!');
  console.log('✅ 2b. Search returned item. Matched words:', matchedItem.matchedWords, 'Match %:', matchedItem.matchPercent);

  // 3. User B requests to chat with the finder
  const chatRes = await fetch(`${VITE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ foundItemId: createdItem.id }),
  });
  if (!chatRes.ok) {
    const errText = await chatRes.text();
    throw new Error(`Chat request failed: ${chatRes.status} ${errText}`);
  }
  const chatData = await chatRes.json();
  console.log('✅ 3a. User B requested chat, got conversation:', chatData.id, 'Status:', chatData.status);

  // Check DB conversations and messages tables
  const convRow = db.prepare('SELECT * FROM conversations WHERE id = ?').get(chatData.id);
  if (!convRow) throw new Error('Conversation row missing from SQLite database!');
  console.log('✅ 3b. DB conversation row verified: owner_id =', convRow.owner_id, 'finder_id =', convRow.finder_id);

  const msgs = db.prepare('SELECT * FROM messages WHERE conversation_id = ?').all(chatData.id);
  if (msgs.length === 0) throw new Error('No messages recorded for conversation!');
  console.log('✅ 3c. DB messages row verified:', msgs[0].text, 'kind =', msgs[0].kind);

  // 4. Same request twice returns the exact same conversation
  const chatRes2 = await fetch(`${VITE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ foundItemId: createdItem.id }),
  });
  if (!chatRes2.ok) throw new Error(`Second chat request failed: ${chatRes2.status}`);
  const chatData2 = await chatRes2.json();
  if (chatData2.id !== chatData.id) {
    throw new Error(`Second chat call returned different conversation ID! ${chatData2.id} vs ${chatData.id}`);
  }
  console.log('✅ 4. Idempotent check: same request returned existing conversation ID:', chatData2.id);

  // Clean up temporary test file
  if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);

  console.log('--- ALL 4 CHECKS PASSED PERFECTLY ---');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
