// backend/scripts/seed.js
// -------------------------------------------------------------
// This script seeds our FindBack SQLite database with realistic demo data:
// - 5 demo users with campus details and points
// - Copies sample photos from frontend/public/hero/ to backend/uploads/
// - Creates ~14 lost & found item reports spread across the past 8 calendar months
//   to produce a clean, growing trend for analytics and graphs
// - One fully completed conversation showing a match and return flow
//
// Usage:
//   npm run seed          (populates demo data)
//   npm run seed -- --reset  (clears all existing database rows first, then seeds)
// -------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import db from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendHeroDir = path.resolve(__dirname, '../../frontend/public/hero');
const backendUploadsDir = path.resolve(__dirname, '../uploads');

// Ensure destination uploads directory exists
if (!fs.existsSync(backendUploadsDir)) {
  fs.mkdirSync(backendUploadsDir, { recursive: true });
}

// Check for --reset flag
const shouldReset = process.argv.includes('--reset');

if (shouldReset) {
  console.log('🔄 --reset flag detected: clearing all existing database records...');
  db.exec(`
    DELETE FROM messages;
    DELETE FROM feedback;
    DELETE FROM notifications;
    DELETE FROM conversations;
    DELETE FROM items;
    DELETE FROM users;
  `);
  console.log('✨ All tables cleared successfully.');
}

// -------------------------------------------------------------
// 1. Copy hero images from frontend to backend/uploads
// -------------------------------------------------------------
console.log('📦 Copying sample hero images to backend/uploads...');
const heroImages = [
  'airpods.png',
  'calculator.jpg',
  'casio_watch.jpg',
  'hp_charger.jpg',
  'student_id.jpg',
  'tote.jpg',
  'wallet.jpg',
];

for (const imgName of heroImages) {
  const src = path.join(frontendHeroDir, imgName);
  const dest = path.join(backendUploadsDir, imgName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}
console.log(`✅ Copied ${heroImages.length} sample images.`);

// -------------------------------------------------------------
// 2. Insert 5 Demo Users
// -------------------------------------------------------------
console.log('👤 Seeding demo users...');
const now = new Date();
const nowMs = now.getTime();

const demoUsers = [
  {
    id: 'user-seed-owner',
    name: 'owner',
    email: 'ownertest@gmail.com',
    whatsapp: '1234567890',
    campus: 'VIT Pune',
    points: 80,
  },
  {
    id: 'user-seed-founder',
    name: 'founder',
    email: 'foundertest@gmail.com',
    whatsapp: '9876543210',
    campus: 'VIT Pune',
    points: 120,
  },
  {
    id: 'user-seed-aditi',
    name: 'Aditi Sharma',
    email: 'aditi@demo.findback.test',
    whatsapp: '+919876543001',
    campus: 'VIT Pune',
    points: 150,
  },
  {
    id: 'user-seed-rohan',
    name: 'Rohan Verma',
    email: 'rohan@demo.findback.test',
    whatsapp: '+919876543002',
    campus: 'VIT Pune',
    points: 100,
  },
  {
    id: 'user-seed-priya',
    name: 'Priya Nair',
    email: 'priya@demo.findback.test',
    whatsapp: '+919876543003',
    campus: 'VIT Pune',
    points: 50,
  },
  {
    id: 'user-seed-kabir',
    name: 'Kabir Mehta',
    email: 'kabir@demo.findback.test',
    whatsapp: '+919876543004',
    campus: 'VIT Pune',
    points: 50,
  },
  {
    id: 'user-seed-ananya',
    name: 'Ananya Sen',
    email: 'ananya@demo.findback.test',
    whatsapp: '+919876543005',
    campus: 'VIT Pune',
    points: 0,
  },
];

const insertUserStmt = db.prepare(`
  INSERT OR REPLACE INTO users (id, name, email, whatsapp, campus, points, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const u of demoUsers) {
  insertUserStmt.run(u.id, u.name, u.email, u.whatsapp, u.campus, u.points, nowMs - 200 * 24 * 3600 * 1000);
}
console.log(`✅ Seeded ${demoUsers.length} users.`);

// -------------------------------------------------------------
// 3. Helper to generate calendar timestamps for the past 8 months
// -------------------------------------------------------------
function getPastDate(monthsAgo, dayOfMonth, hour = 14) {
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, dayOfMonth, hour, 0, 0);
  return d.getTime();
}

function getIsoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

// -------------------------------------------------------------
// 4. Seed Items Across the 8 Months (Growing Trend)
// -------------------------------------------------------------
console.log('📋 Seeding items across the last 8 months...');

const insertItemStmt = db.prepare(`
  INSERT OR REPLACE INTO items (
    id, type, description, category, location, date,
    image_path, reporter_id, status, created_at, returned_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Item definitions
const seedItems = [
  // 7 months ago
  {
    id: 'item-seed-01',
    type: 'found',
    description: 'Black Leather Bifold Wallet with bus pass',
    category: 'Wallets & Bags',
    location: 'Central Library Floor 1',
    date: getIsoDate(getPastDate(7, 5)),
    image_path: '/uploads/wallet.jpg',
    reporter_id: 'user-seed-aditi',
    status: 'returned',
    created_at: getPastDate(7, 5),
    returned_at: getPastDate(7, 8),
  },
  {
    id: 'item-seed-02',
    type: 'lost',
    description: 'Blue Spiral Notebook and metallic pen',
    category: 'Books & Stationery',
    location: 'Old Academic Block Room 204',
    date: getIsoDate(getPastDate(7, 12)),
    image_path: null,
    reporter_id: 'user-seed-rohan',
    status: 'reported',
    created_at: getPastDate(7, 12),
    returned_at: null,
  },

  // 6 months ago
  {
    id: 'item-seed-03',
    type: 'found',
    description: 'Scientific Calculator Casio fx-991EX ClassWiz',
    category: 'Electronics',
    location: 'Physics Lab 3',
    date: getIsoDate(getPastDate(6, 4)),
    image_path: '/uploads/calculator.jpg',
    reporter_id: 'user-seed-rohan',
    status: 'returned',
    created_at: getPastDate(6, 4),
    returned_at: getPastDate(6, 7),
  },
  {
    id: 'item-seed-04',
    type: 'lost',
    description: 'Grey Wool Beanie Cap left on bench',
    category: 'Clothing',
    location: 'Sports Ground Pavilion',
    date: getIsoDate(getPastDate(6, 15)),
    image_path: null,
    reporter_id: 'user-seed-priya',
    status: 'reported',
    created_at: getPastDate(6, 15),
    returned_at: null,
  },

  // 5 months ago
  {
    id: 'item-seed-05',
    type: 'found',
    description: 'HP 65W USB-C Original Laptop Charger with power cord',
    category: 'Electronics',
    location: 'Engineering Seminar Hall',
    date: getIsoDate(getPastDate(5, 3)),
    image_path: '/uploads/hp_charger.jpg',
    reporter_id: 'user-seed-kabir',
    status: 'returned',
    created_at: getPastDate(5, 3),
    returned_at: getPastDate(5, 6),
  },
  {
    id: 'item-seed-06',
    type: 'found',
    description: 'Silver Insulated Water Bottle 750ml',
    category: 'Accessories',
    location: 'Student Activity Center',
    date: getIsoDate(getPastDate(5, 14)),
    image_path: null,
    reporter_id: 'user-seed-aditi',
    status: 'reported',
    created_at: getPastDate(5, 14),
    returned_at: null,
  },
  {
    id: 'item-seed-07',
    type: 'lost',
    description: 'Room Keys on red spiral lanyard',
    category: 'Keys',
    location: 'Hostel Block B Entrance',
    date: getIsoDate(getPastDate(5, 20)),
    image_path: null,
    reporter_id: 'user-seed-ananya',
    status: 'reported',
    created_at: getPastDate(5, 20),
    returned_at: null,
  },

  // 4 months ago
  {
    id: 'item-seed-08',
    type: 'found',
    description: 'Vintage Casio Digital Watch A168W stainless steel',
    category: 'Accessories',
    location: 'Chemistry Department Corridor',
    date: getIsoDate(getPastDate(4, 6)),
    image_path: '/uploads/casio_watch.jpg',
    reporter_id: 'user-seed-aditi',
    status: 'returned',
    created_at: getPastDate(4, 6),
    returned_at: getPastDate(4, 9),
  },
  {
    id: 'item-seed-09',
    type: 'found',
    description: 'Beige Canvas Tote Bag with graphic print and literature books',
    category: 'Wallets & Bags',
    location: 'Campus Coffee House',
    date: getIsoDate(getPastDate(4, 18)),
    image_path: '/uploads/tote.jpg',
    reporter_id: 'user-seed-priya',
    status: 'reported',
    created_at: getPastDate(4, 18),
    returned_at: null,
  },
  {
    id: 'item-seed-10',
    type: 'lost',
    description: 'Compact Black Umbrella with wooden curved handle',
    category: 'Accessories',
    location: 'Main Auditorium Foyer',
    date: getIsoDate(getPastDate(4, 22)),
    image_path: null,
    reporter_id: 'user-seed-kabir',
    status: 'reported',
    created_at: getPastDate(4, 22),
    returned_at: null,
  },

  // 3 months ago
  {
    id: 'item-seed-11',
    type: 'found',
    description: 'Apple AirPods Pro 2 with MagSafe Wireless Charging Case',
    category: 'Electronics',
    location: 'Study Area 2nd Floor',
    date: getIsoDate(getPastDate(3, 8)),
    image_path: '/uploads/airpods.png',
    reporter_id: 'user-seed-rohan',
    status: 'returned',
    created_at: getPastDate(3, 8),
    returned_at: getPastDate(3, 11),
  },
  {
    id: 'item-seed-12',
    type: 'found',
    description: 'Student ID Card for Department of Computer Science',
    category: 'Cards & Documents',
    location: 'Central Canteen Counter',
    date: getIsoDate(getPastDate(3, 15)),
    image_path: '/uploads/student_id.jpg',
    reporter_id: 'user-seed-kabir',
    status: 'reported',
    created_at: getPastDate(3, 15),
    returned_at: null,
  },
  {
    id: 'item-seed-13',
    type: 'lost',
    description: 'Green Ray-Ban Sunglasses in leather protective case',
    category: 'Accessories',
    location: 'Tennis Court Benches',
    date: getIsoDate(getPastDate(3, 20)),
    image_path: null,
    reporter_id: 'user-seed-rohan',
    status: 'reported',
    created_at: getPastDate(3, 20),
    returned_at: null,
  },

  // 2 months ago
  {
    id: 'item-seed-14',
    type: 'found',
    description: 'Casio Vintage Gold Tone Metallic Digital Watch',
    category: 'Accessories',
    location: 'Faculty Building Lobby',
    date: getIsoDate(getPastDate(2, 5)),
    image_path: '/uploads/casio_watch.jpg',
    reporter_id: 'user-seed-priya',
    status: 'returned',
    created_at: getPastDate(2, 5),
    returned_at: getPastDate(2, 7),
  },
  {
    id: 'item-seed-15',
    type: 'found',
    description: 'HP Pavilion 65W Laptop Power Supply adapter',
    category: 'Electronics',
    location: 'Computer Lab 102',
    date: getIsoDate(getPastDate(2, 12)),
    image_path: '/uploads/hp_charger.jpg',
    reporter_id: 'user-seed-rohan',
    status: 'reported',
    created_at: getPastDate(2, 12),
    returned_at: null,
  },

  // 1 month ago
  {
    id: 'item-seed-16',
    type: 'found',
    description: 'Student ID Card B.Tech Student roll number 2024-CS-091',
    category: 'Cards & Documents',
    location: 'Mathematics Lecture Hall 1',
    date: getIsoDate(getPastDate(1, 4)),
    image_path: '/uploads/student_id.jpg',
    reporter_id: 'user-seed-aditi',
    status: 'returned',
    created_at: getPastDate(1, 4),
    returned_at: getPastDate(1, 6),
  },
  {
    id: 'item-seed-17',
    type: 'found',
    description: 'Casio fx Calculator with matte slide cover',
    category: 'Electronics',
    location: 'Central Library Silent Zone',
    date: getIsoDate(getPastDate(1, 10)),
    image_path: '/uploads/calculator.jpg',
    reporter_id: 'user-seed-rohan',
    status: 'reported',
    created_at: getPastDate(1, 10),
    returned_at: null,
  },

  // Current Month (0 months ago)
  // Target item for our finished demo conversation!
  {
    id: 'item-seed-finished-airpods',
    type: 'found',
    description: 'White Apple AirPods Pro 2nd Gen with teal silicone case',
    category: 'Electronics',
    location: 'Library 3rd Floor Quiet Zone',
    date: getIsoDate(getPastDate(0, 1)),
    image_path: '/uploads/airpods.png',
    reporter_id: 'user-seed-aditi', // Finder
    status: 'returned',
    created_at: getPastDate(0, 1),
    returned_at: getPastDate(0, 3),
  },
  {
    id: 'item-seed-current-lost-wallet',
    type: 'lost',
    description: 'Black Leather Trifold Wallet with student ID and metro pass',
    category: 'Wallets & Bags',
    location: 'Campus Shuttle Bus Stop',
    date: getIsoDate(getPastDate(0, 2)),
    image_path: '/uploads/wallet.jpg',
    reporter_id: 'user-seed-ananya',
    status: 'reported',
    created_at: getPastDate(0, 2),
    returned_at: null,
  },
  {
    id: 'item-seed-current-tote',
    type: 'found',
    description: 'Graphic Printed Cotton Tote Bag with chemistry notebooks',
    category: 'Wallets & Bags',
    location: 'Cafeteria Outdoor Seating',
    date: getIsoDate(getPastDate(0, 4)),
    image_path: '/uploads/tote.jpg',
    reporter_id: 'user-seed-priya',
    status: 'reported',
    created_at: getPastDate(0, 4),
    returned_at: null,
  },
  {
    id: 'item-seed-current-charger',
    type: 'found',
    description: 'HP 65W Fast Charger black cord',
    category: 'Electronics',
    location: 'Admin Building Reception',
    date: getIsoDate(getPastDate(0, 5)),
    image_path: '/uploads/hp_charger.jpg',
    reporter_id: 'user-seed-kabir',
    status: 'reported',
    created_at: getPastDate(0, 5),
    returned_at: null,
  },

  // Active items for founder and owner demo conversations
  {
    id: 'item-seed-founder-calc',
    type: 'found',
    description: 'Casio FX-991CW Scientific Calculator with black sliding cover',
    category: 'Electronics',
    location: 'Audi 1, Ground Floor - VIT Pune',
    date: getIsoDate(getPastDate(0, 1)),
    image_path: '/uploads/calculator.jpg',
    reporter_id: 'user-seed-founder',
    status: 'reported',
    created_at: getPastDate(0, 1),
    returned_at: null,
  },
  {
    id: 'item-seed-founder-airpods',
    type: 'found',
    description: 'White Apple AirPods Pro 2 with teal silicone case',
    category: 'Electronics',
    location: 'Campus Canteen, Table 12 - VIT Pune',
    date: getIsoDate(getPastDate(0, 2)),
    image_path: '/uploads/airpods.png',
    reporter_id: 'user-seed-founder',
    status: 'reported',
    created_at: getPastDate(0, 2),
    returned_at: null,
  },
  {
    id: 'item-seed-founder-id',
    type: 'found',
    description: 'Leather Student ID Card Holder with VIT Pune RFID Card',
    category: 'Documents & IDs',
    location: 'Near Main Gate Security - VIT Pune',
    date: getIsoDate(getPastDate(0, 3)),
    image_path: '/uploads/student_id.jpg',
    reporter_id: 'user-seed-founder',
    status: 'matched',
    created_at: getPastDate(0, 3),
    returned_at: null,
  },
  {
    id: 'item-seed-founder-tote',
    type: 'found',
    description: 'Beige Canvas Tote Bag with VIT Pune Library Books',
    category: 'Bags & Backpacks',
    location: 'Sports Complex Lawn - VIT Pune',
    date: getIsoDate(getPastDate(0, 10)),
    image_path: '/uploads/tote.jpg',
    reporter_id: 'user-seed-founder',
    status: 'returned',
    created_at: getPastDate(0, 10),
    returned_at: getPastDate(0, 12),
  },
  {
    id: 'item-seed-owner-watch',
    type: 'found',
    description: 'Silver Casio Vintage Digital Watch with stainless steel strap',
    category: 'Clothing & Accessories',
    location: 'Mechanical Dept Workshop - VIT Pune',
    date: getIsoDate(getPastDate(0, 3)),
    image_path: '/uploads/casio_watch.jpg',
    reporter_id: 'user-seed-aditi',
    status: 'matched',
    created_at: getPastDate(0, 3),
    returned_at: null,
  },
  {
    id: 'item-seed-owner-charger',
    type: 'found',
    description: 'Black HP Laptop Charger 65W with Type-C pin',
    category: 'Electronics',
    location: 'Central Library Reading Hall - VIT Pune',
    date: getIsoDate(getPastDate(0, 8)),
    image_path: '/uploads/hp_charger.jpg',
    reporter_id: 'user-seed-kabir',
    status: 'returned',
    created_at: getPastDate(0, 8),
    returned_at: getPastDate(0, 9),
  },
  {
    id: 'item-seed-owner-lost-calc',
    type: 'lost',
    description: 'Casio FX-991CW Calculator lost during M3 lecture',
    category: 'Electronics',
    location: 'Audi 1, Ground Floor - VIT Pune',
    date: getIsoDate(getPastDate(0, 1)),
    image_path: null,
    reporter_id: 'user-seed-owner',
    status: 'reported',
    created_at: getPastDate(0, 1),
    returned_at: null,
  },
];

for (const item of seedItems) {
  insertItemStmt.run(
    item.id,
    item.type,
    item.description,
    item.category,
    item.location,
    item.date,
    item.image_path,
    item.reporter_id,
    item.status,
    item.created_at,
    item.returned_at
  );
}
console.log(`✅ Seeded ${seedItems.length} photo items.`);

// -------------------------------------------------------------
// 4b. Seed Lightweight Historical Items across 8 Calendar Months
// -------------------------------------------------------------
// Requirements:
// - Reported counts growing from ~40 to ~120 per month across the 8 months
// - Returned counts roughly 70% to 80% of reported each month (~75%)
// - Lightweight (no photos: image_path = null)
// - Realistic created_at and returned_at within each calendar month
// - Uses the 5 demo users
// - Clearly marked as seed data ([Seed Data] prefix and item-seed-hist- ID)
console.log('📈 Seeding lightweight historical items (growing trend ~40 to ~120/mo, ~75% returned)...');

const targetMonthlyPlan = [
  { monthsAgo: 7, targetReported: 40, targetReturned: 30 },
  { monthsAgo: 6, targetReported: 51, targetReturned: 38 },
  { monthsAgo: 5, targetReported: 63, targetReturned: 48 },
  { monthsAgo: 4, targetReported: 74, targetReturned: 56 },
  { monthsAgo: 3, targetReported: 86, targetReturned: 65 },
  { monthsAgo: 2, targetReported: 97, targetReturned: 74 },
  { monthsAgo: 1, targetReported: 109, targetReturned: 82 },
  { monthsAgo: 0, targetReported: 120, targetReturned: 90 },
];

const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

function getMonthBucketBounds(monthsAgo) {
  const d = new Date(currentYear, currentMonth - monthsAgo, 1);
  const y = d.getFullYear();
  const m = d.getMonth();
  const startMs = new Date(y, m, 1).getTime();
  const endMs = new Date(y, m + 1, 1).getTime();
  return { y, m, startMs, endMs };
}

const sampleCatalog = [
  { desc: 'Wireless Bluetooth Mouse', cat: 'Electronics', type: 'found', loc: 'Computer Lab 3' },
  { desc: 'USB-C Fast Charging Cable', cat: 'Electronics', type: 'lost', loc: 'Central Library Floor 2' },
  { desc: 'Power Bank 10000mAh black', cat: 'Electronics', type: 'found', loc: 'Cafeteria Patio' },
  { desc: 'Casio fx Scientific Calculator', cat: 'Electronics', type: 'lost', loc: 'Mathematics Hall' },
  { desc: 'Earphones with 3.5mm audio jack', cat: 'Electronics', type: 'lost', loc: 'Music Club Room' },
  { desc: 'TI-84 Plus Graphing Calculator', cat: 'Electronics', type: 'found', loc: 'Engineering Block 2' },
  { desc: 'HDMI to USB-C Display Adapter', cat: 'Electronics', type: 'found', loc: 'Seminar Room 204' },
  { desc: '64GB Metallic Flash Drive', cat: 'Electronics', type: 'lost', loc: 'Main Computer Center' },
  { desc: 'Smartwatch magnetic charger cable', cat: 'Electronics', type: 'found', loc: 'Hostel Recreation Hall' },
  { desc: 'Wireless Earbuds charging case', cat: 'Electronics', type: 'found', loc: 'Library Silent Floor' },
  { desc: 'Nylon Laptop Backpack navy', cat: 'Wallets & Bags', type: 'found', loc: 'Student Center Lounge' },
  { desc: 'Brown Leather Cardholder with metro card', cat: 'Wallets & Bags', type: 'lost', loc: 'Main Gate Canteen' },
  { desc: 'Gym Duffle Bag black with white stripe', cat: 'Wallets & Bags', type: 'lost', loc: 'Indoor Badminton Court' },
  { desc: 'Fabric Zip Pencil Pouch with markers', cat: 'Wallets & Bags', type: 'found', loc: 'Architecture Studio 2' },
  { desc: 'Canvas Shoulder Tote Bag off-white', cat: 'Wallets & Bags', type: 'found', loc: 'Campus Bookstore' },
  { desc: 'Slim RFID Blocking Card Wallet', cat: 'Wallets & Bags', type: 'lost', loc: 'Central Canteen' },
  { desc: 'Dorm Room Key with blue tag', cat: 'Keys', type: 'found', loc: 'Hostel Block C' },
  { desc: 'Bike Lock Key on brass ring', cat: 'Keys', type: 'lost', loc: 'Bicycle Parking Stand' },
  { desc: 'Steel Locker Padlock Key #14', cat: 'Keys', type: 'found', loc: 'Sports Complex Lockers' },
  { desc: 'Motorcycle Key with Honda rubber keychain', cat: 'Keys', type: 'lost', loc: 'Student Parking Lot B' },
  { desc: 'Student Transit Metro Pass Card', cat: 'Cards & Documents', type: 'found', loc: 'Bus Stop Pavilion' },
  { desc: 'Campus Library Access Card', cat: 'Cards & Documents', type: 'lost', loc: 'Quiet Study Hall' },
  { desc: 'Government Photo ID Card', cat: 'Cards & Documents', type: 'found', loc: 'Administrative Office Floor 1' },
  { desc: 'Medical Health Insurance Card', cat: 'Cards & Documents', type: 'lost', loc: 'Campus Health Center' },
  { desc: 'Spiral Bound Laboratory Manual', cat: 'Cards & Documents', type: 'found', loc: 'Biotechnology Lab' },
  { desc: 'Organic Chemistry 4th Edition Textbook', cat: 'Books & Stationery', type: 'found', loc: 'Chemistry Department' },
  { desc: 'Hardcover Ruled Journal with sketches', cat: 'Books & Stationery', type: 'lost', loc: 'Arts Lawn' },
  { desc: 'Engineering Drawing Tool Kit in tin box', cat: 'Books & Stationery', type: 'found', loc: 'Design Workshop 1' },
  { desc: 'Linear Algebra Lecture Notes binder', cat: 'Books & Stationery', type: 'lost', loc: 'Lecture Hall 105' },
  { desc: 'College Embroidered Varsity Jacket', cat: 'Clothing', type: 'lost', loc: 'Athletics Ground' },
  { desc: 'Knitted Wool Winter Scarf grey', cat: 'Clothing', type: 'found', loc: 'Campus Amphitheater' },
  { desc: 'Navy Blue Zip-up Windbreaker', cat: 'Clothing', type: 'lost', loc: 'Tennis Courts' },
  { desc: 'Black Baseball Cap with university crest', cat: 'Clothing', type: 'found', loc: 'Basketball Arena' },
  { desc: 'Insulated Stainless Steel Water Flask', cat: 'Accessories', type: 'found', loc: 'Sports Complex Gym' },
  { desc: 'Prescription Glasses in matte black case', cat: 'Accessories', type: 'lost', loc: 'Lecture Hall 4' },
  { desc: 'Folding Windproof Umbrella navy blue', cat: 'Accessories', type: 'found', loc: 'Auditorium Entrance' },
  { desc: 'Polarized Aviator Sunglasses', cat: 'Accessories', type: 'lost', loc: 'Open Air Theatre' },
  { desc: 'Fitness Tracker Wristband black band', cat: 'Accessories', type: 'found', loc: 'Running Track Bleachers' },
];

const lightweightItems = [];

for (const plan of targetMonthlyPlan) {
  const bounds = getMonthBucketBounds(plan.monthsAgo);

  // Count existing photo items in this calendar month bucket
  const photoReported = seedItems.filter(
    item => item.created_at >= bounds.startMs && item.created_at < bounds.endMs
  ).length;

  const photoReturned = seedItems.filter(
    item => item.status === 'returned' && item.returned_at && item.returned_at >= bounds.startMs && item.returned_at < bounds.endMs
  ).length;

  const neededReported = Math.max(0, plan.targetReported - photoReported);
  const neededReturned = Math.max(0, plan.targetReturned - photoReturned);

  for (let k = 0; k < neededReported; k++) {
    const isReturned = k < neededReturned;
    const tpl = sampleCatalog[k % sampleCatalog.length];
    const reporter = demoUsers[k % demoUsers.length];

    let createdAt;
    let returnedAt = null;

    if (plan.monthsAgo > 0) {
      // Past months: spread across days 1 to 23 so returned_at stays strictly within the month
      const daysInMonth = new Date(bounds.y, bounds.m + 1, 0).getDate();
      const maxDay = Math.min(23, daysInMonth - 5);
      const day = 1 + Math.floor((k / neededReported) * maxDay);
      const hour = 8 + (k % 12);
      const minute = (k * 13) % 60;
      createdAt = new Date(bounds.y, bounds.m, day, hour, minute, 0).getTime();

      if (isReturned) {
        // Average 2.2 days to return (1.0 to 3.4 days)
        const returnDiffDays = 1.0 + ((k * 17) % 25) / 10;
        returnedAt = createdAt + Math.round(returnDiffDays * 86400 * 1000);
      }
    } else {
      // Current month: all created_at and returned_at must be strictly in the past (<= nowMs) and in current month
      const monthStartMs = bounds.startMs;
      const nowMs = Date.now();
      const elapsedMs = Math.max(3600 * 1000, nowMs - monthStartMs);
      const safeCreatedSpan = Math.max(1000, elapsedMs - 36 * 3600 * 1000);
      const frac = (k + 0.5) / neededReported;
      createdAt = Math.floor(monthStartMs + frac * safeCreatedSpan);

      if (isReturned) {
        const maxDiffMs = (nowMs - 10 * 60 * 1000) - createdAt;
        const targetDiffMs = Math.round((1.0 + ((k * 13) % 20) / 10) * 86400 * 1000);
        const diffMs = Math.max(3600 * 1000, Math.min(maxDiffMs, targetDiffMs));
        returnedAt = createdAt + diffMs;
      }
    }

    lightweightItems.push({
      id: `item-seed-hist-m${plan.monthsAgo}-${String(k + 1).padStart(3, '0')}`,
      type: tpl.type,
      description: `[Seed Data] ${tpl.desc}`,
      category: tpl.cat,
      location: tpl.loc,
      date: getIsoDate(createdAt),
      image_path: null,
      reporter_id: reporter.id,
      status: isReturned ? 'returned' : 'reported',
      created_at: createdAt,
      returned_at: returnedAt,
    });
  }
}

// Insert all lightweight items inside a single database transaction
const insertHistoricalItems = db.transaction((items) => {
  for (const item of items) {
    insertItemStmt.run(
      item.id,
      item.type,
      item.description,
      item.category,
      item.location,
      item.date,
      item.image_path,
      item.reporter_id,
      item.status,
      item.created_at,
      item.returned_at
    );
  }
});
insertHistoricalItems(lightweightItems);
console.log(`✅ Seeded ${lightweightItems.length} lightweight historical items (total items: ${seedItems.length + lightweightItems.length}).`);

// -------------------------------------------------------------
// -------------------------------------------------------------
// 5. Seed Conversations & Messaging for Owner, Founder & Demo Users
// -------------------------------------------------------------
console.log('💬 Seeding claim conversations, messages, feedback, and notifications...');

const insertConvStmt = db.prepare(`
  INSERT OR REPLACE INTO conversations (
    id, found_item_id, lost_item_id, owner_id, finder_id,
    status, created_at, updated_at, matched_at, closed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMsgStmt = db.prepare(`
  INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, kind, text, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertFbStmt = db.prepare(`
  INSERT OR REPLACE INTO feedback (id, conversation_id, user_id, stage, outcome, explanation, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertNotifStmt = db.prepare(`
  INSERT OR REPLACE INTO notifications (id, user_id, type, title, message, link, read, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 1. Original finished demo conversation (Aditi Finder + Rohan Owner)
const convId = 'conv-seed-demo-finished';
const foundItemId = 'item-seed-finished-airpods';
const finderId = 'user-seed-aditi';
const ownerId = 'user-seed-rohan';

const convCreated = getPastDate(0, 1, 15);
const convMatched = getPastDate(0, 2, 10);
const convReturned = getPastDate(0, 3, 14);

insertConvStmt.run(
  convId,
  foundItemId,
  null,
  ownerId,
  finderId,
  'returned',
  convCreated,
  convReturned,
  convMatched,
  convReturned
);

const conversationMessages = [
  { id: 'msg-seed-1', conversation_id: convId, sender_id: null, kind: 'system', text: 'Chat started', created_at: convCreated },
  { id: 'msg-seed-2', conversation_id: convId, sender_id: ownerId, kind: 'text', text: 'Hi Aditi! I think you found my AirPods. They have a teal silicone case with a tiny nick on the left side.', created_at: getPastDate(0, 1, 16) },
  { id: 'msg-seed-3', conversation_id: convId, sender_id: finderId, kind: 'text', text: 'Hi Rohan! Yes, they definitely have the teal case with the nick! Let me confirm the match right away.', created_at: getPastDate(0, 2, 9) },
  { id: 'msg-seed-4', conversation_id: convId, sender_id: null, kind: 'system', text: 'The finder confirmed this is a match.', created_at: convMatched },
  { id: 'msg-seed-5', conversation_id: convId, sender_id: ownerId, kind: 'text', text: 'Awesome! We can meet outside the library reception desk at 2 PM to hand them over.', created_at: getPastDate(0, 2, 11) },
  { id: 'msg-seed-6', conversation_id: convId, sender_id: finderId, kind: 'text', text: 'Sounds great, see you at 2 PM!', created_at: getPastDate(0, 2, 12) },
  { id: 'msg-seed-7', conversation_id: convId, sender_id: null, kind: 'system', text: 'The owner confirmed the item was returned. +50 points to the finder.', created_at: convReturned },
];

for (const m of conversationMessages) {
  insertMsgStmt.run(m.id, m.conversation_id, m.sender_id, m.kind, m.text, m.created_at);
}

insertFbStmt.run('fb-seed-1', convId, finderId, 'match', 'matched', 'Verified unique teal silicone case and nick', convMatched);
insertFbStmt.run('fb-seed-2', convId, ownerId, 'return', 'returned', 'Met at library desk, verified serial number and connected to iPhone', convReturned);

insertNotifStmt.run('notif-seed-1', finderId, 'claim', 'New Claim Request', 'Rohan Verma started a chat about "White Apple AirPods Pro..."', `/people?chat=${convId}`, 1, convCreated);
insertNotifStmt.run('notif-seed-2', ownerId, 'match', 'Match Confirmed!', 'The finder confirmed your item is a match. You can now coordinate the return.', `/people?chat=${convId}`, 1, convMatched);
insertNotifStmt.run('notif-seed-3', finderId, 'returned', 'Item Returned! (+50 Points)', 'The owner confirmed receiving their item. You earned 50 points!', `/people?chat=${convId}`, 0, convReturned);

// -------------------------------------------------------------
// 2. Chat between Owner (user-seed-owner) and Founder (user-seed-founder)
// Status: 'chatting' (Active claim on Casio Calculator)
// -------------------------------------------------------------
const convOfId = 'conv-seed-owner-founder-calc';
const ofCreated = getPastDate(0, 1, 10);
const ofUpdated = getPastDate(0, 1, 14);

insertConvStmt.run(
  convOfId,
  'item-seed-founder-calc',
  'item-seed-owner-lost-calc',
  'user-seed-owner',
  'user-seed-founder',
  'chatting',
  ofCreated,
  ofUpdated,
  null,
  null
);

const ofMessages = [
  { id: 'msg-of-1', conversation_id: convOfId, sender_id: null, kind: 'system', text: 'Chat started', created_at: ofCreated },
  { id: 'msg-of-2', conversation_id: convOfId, sender_id: 'user-seed-owner', kind: 'text', text: 'Hi founder! I think this Casio calculator is mine. I left it in Audi 1 after the M3 lecture on Tuesday.', created_at: getPastDate(0, 1, 11) },
  { id: 'msg-of-3', conversation_id: convOfId, sender_id: 'user-seed-founder', kind: 'text', text: 'Hey! Yes, I found it on the third row desk. Does it have any specific marks or stickers on it?', created_at: getPastDate(0, 1, 12) },
  { id: 'msg-of-4', conversation_id: convOfId, sender_id: 'user-seed-owner', kind: 'text', text: "Yes! It has a small blue dot sticker on the back of the sliding cover and my initials 'O.K.' lightly engraved on the top right corner.", created_at: getPastDate(0, 1, 13) },
  { id: 'msg-of-5', conversation_id: convOfId, sender_id: 'user-seed-founder', kind: 'text', text: 'Checking right now... yes! It has the blue sticker and the initials. Let me confirm the match.', created_at: ofUpdated },
];

for (const m of ofMessages) {
  insertMsgStmt.run(m.id, m.conversation_id, m.sender_id, m.kind, m.text, m.created_at);
}

insertNotifStmt.run('notif-of-1', 'user-seed-founder', 'claim', 'New Claim Request', 'owner started a chat about "Casio FX-991CW Scientific Calculator..."', `/people?chat=${convOfId}`, 0, ofCreated);
insertNotifStmt.run('notif-of-2', 'user-seed-owner', 'claim', 'Claim Chat Started', 'You started a chat with founder about "Casio FX-991CW Scientific Calculator..."', `/people?chat=${convOfId}`, 1, ofCreated);

// -------------------------------------------------------------
// 3. Founder with Rohan Verma on AirPods
// Status: 'chatting' (Active discussion with random campus student)
// -------------------------------------------------------------
const convFrId = 'conv-seed-founder-rohan-airpods';
const frCreated = getPastDate(0, 2, 11);
const frUpdated = getPastDate(0, 2, 15);

insertConvStmt.run(
  convFrId,
  'item-seed-founder-airpods',
  null,
  'user-seed-rohan',
  'user-seed-founder',
  'chatting',
  frCreated,
  frUpdated,
  null,
  null
);

const frMessages = [
  { id: 'msg-fr-1', conversation_id: convFrId, sender_id: null, kind: 'system', text: 'Chat started', created_at: frCreated },
  { id: 'msg-fr-2', conversation_id: convFrId, sender_id: 'user-seed-rohan', kind: 'text', text: 'Hello founder! Did you find the AirPods Pro near table 12 in the canteen?', created_at: getPastDate(0, 2, 12) },
  { id: 'msg-fr-3', conversation_id: convFrId, sender_id: 'user-seed-founder', kind: 'text', text: 'Yes, found them yesterday afternoon. Can you confirm the case details?', created_at: getPastDate(0, 2, 13) },
  { id: 'msg-fr-4', conversation_id: convFrId, sender_id: 'user-seed-rohan', kind: 'text', text: 'It has a teal silicone case with a tiny nick near the charging port from my keychain.', created_at: getPastDate(0, 2, 14) },
  { id: 'msg-fr-5', conversation_id: convFrId, sender_id: 'user-seed-founder', kind: 'text', text: 'Inspecting it now... yes, the tiny nick is right above the port!', created_at: getPastDate(0, 2, 14, 30) },
  { id: 'msg-fr-6', conversation_id: convFrId, sender_id: 'user-seed-rohan', kind: 'text', text: "Awesome, that's definitely mine! Can you confirm when you get a chance?", created_at: frUpdated },
];

for (const m of frMessages) {
  insertMsgStmt.run(m.id, m.conversation_id, m.sender_id, m.kind, m.text, m.created_at);
}

insertNotifStmt.run('notif-fr-1', 'user-seed-founder', 'claim', 'New Claim Request', 'Rohan Verma started a chat about "White Apple AirPods Pro 2..."', `/people?chat=${convFrId}`, 0, frCreated);

// -------------------------------------------------------------
// 4. Founder with Priya Nair on Student ID Card
// Status: 'matched' (Match confirmed, awaiting return)
// -------------------------------------------------------------
const convFpId = 'conv-seed-founder-priya-id';
const fpCreated = getPastDate(0, 3, 9);
const fpMatched = getPastDate(0, 3, 11);

insertConvStmt.run(
  convFpId,
  'item-seed-founder-id',
  null,
  'user-seed-priya',
  'user-seed-founder',
  'matched',
  fpCreated,
  fpMatched,
  fpMatched,
  null
);

const fpMessages = [
  { id: 'msg-fp-1', conversation_id: convFpId, sender_id: null, kind: 'system', text: 'Chat started', created_at: fpCreated },
  { id: 'msg-fp-2', conversation_id: convFpId, sender_id: 'user-seed-priya', kind: 'text', text: 'Hi! I lost my student ID card holder near the VIT Pune main gate security booth.', created_at: getPastDate(0, 3, 9, 30) },
  { id: 'msg-fp-3', conversation_id: convFpId, sender_id: 'user-seed-founder', kind: 'text', text: 'Hi Priya, does the card show Computer Science dept, roll number starting with 22BCS...?', created_at: getPastDate(0, 3, 10) },
  { id: 'msg-fp-4', conversation_id: convFpId, sender_id: 'user-seed-priya', kind: 'text', text: 'Yes, exactly! Roll number 22BCS10482, Priya Nair.', created_at: getPastDate(0, 3, 10, 30) },
  { id: 'msg-fp-5', conversation_id: convFpId, sender_id: null, kind: 'system', text: 'The finder confirmed this is a match.', created_at: fpMatched },
  { id: 'msg-fp-6', conversation_id: convFpId, sender_id: 'user-seed-founder', kind: 'text', text: 'Match confirmed! You can collect it from me near the CS department lobby.', created_at: getPastDate(0, 3, 11, 15) },
  { id: 'msg-fp-7', conversation_id: convFpId, sender_id: 'user-seed-priya', kind: 'text', text: 'Thank you so much! Heading there right now.', created_at: getPastDate(0, 3, 11, 30) },
];

for (const m of fpMessages) {
  insertMsgStmt.run(m.id, m.conversation_id, m.sender_id, m.kind, m.text, m.created_at);
}

insertFbStmt.run('fb-fp-1', convFpId, 'user-seed-founder', 'match', 'matched', 'Verified student roll number 22BCS10482 and photo match', fpMatched);
insertNotifStmt.run('notif-fp-1', 'user-seed-founder', 'match', 'Match Confirmed!', 'You confirmed the match for Priya Nair on "Leather Student ID Card..."', `/people?chat=${convFpId}`, 1, fpMatched);

// -------------------------------------------------------------
// 5. Founder with Ananya Sen on Canvas Tote Bag
// Status: 'returned' (Closed with +50 points)
// -------------------------------------------------------------
const convFaId = 'conv-seed-founder-ananya-tote';
const faCreated = getPastDate(0, 10, 13);
const faMatched = getPastDate(0, 10, 15);
const faReturned = getPastDate(0, 11, 16);

insertConvStmt.run(
  convFaId,
  'item-seed-founder-tote',
  null,
  'user-seed-ananya',
  'user-seed-founder',
  'returned',
  faCreated,
  faReturned,
  faMatched,
  faReturned
);

const faMessages = [
  { id: 'msg-fa-1', conversation_id: convFaId, sender_id: null, kind: 'system', text: 'Chat started', created_at: faCreated },
  { id: 'msg-fa-2', conversation_id: convFaId, sender_id: 'user-seed-ananya', kind: 'text', text: 'Hey founder! Did you find a beige canvas tote bag with library books at the sports ground?', created_at: getPastDate(0, 10, 13, 30) },
  { id: 'msg-fa-3', conversation_id: convFaId, sender_id: 'user-seed-founder', kind: 'text', text: 'Yes! It had two data structures books inside. Verified with the library slips.', created_at: getPastDate(0, 10, 14) },
  { id: 'msg-fa-4', conversation_id: convFaId, sender_id: null, kind: 'system', text: 'The finder confirmed this is a match.', created_at: faMatched },
  { id: 'msg-fa-5', conversation_id: convFaId, sender_id: 'user-seed-ananya', kind: 'text', text: 'Got the bag safely from you. Marking as returned now!', created_at: getPastDate(0, 11, 15) },
  { id: 'msg-fa-6', conversation_id: convFaId, sender_id: null, kind: 'system', text: 'The owner confirmed the item was returned. +50 points to the finder.', created_at: faReturned },
];

for (const m of faMessages) {
  insertMsgStmt.run(m.id, m.conversation_id, m.sender_id, m.kind, m.text, m.created_at);
}

insertFbStmt.run('fb-fa-1', convFaId, 'user-seed-founder', 'match', 'matched', 'Verified library issue slips inside the bag', faMatched);
insertFbStmt.run('fb-fa-2', convFaId, 'user-seed-ananya', 'return', 'returned', 'Met at sports ground pavilion and collected bag', faReturned);

insertNotifStmt.run('notif-fa-1', 'user-seed-founder', 'returned', 'Item Returned! (+50 Points)', 'Ananya Sen confirmed receiving "Beige Canvas Tote Bag...". You earned 50 points!', `/people?chat=${convFaId}`, 1, faReturned);

// -------------------------------------------------------------
// 6. Owner with Aditi Sharma on Vintage Watch
// Status: 'matched' (Contact Unlocked: WhatsApp revealed to owner!)
// -------------------------------------------------------------
const convOaId = 'conv-seed-owner-aditi-watch';
const oaCreated = getPastDate(0, 3, 14);
const oaMatched = getPastDate(0, 3, 16);

insertConvStmt.run(
  convOaId,
  'item-seed-owner-watch',
  null,
  'user-seed-owner',
  'user-seed-aditi',
  'matched',
  oaCreated,
  oaMatched,
  oaMatched,
  null
);

const oaMessages = [
  { id: 'msg-oa-1', conversation_id: convOaId, sender_id: null, kind: 'system', text: 'Chat started', created_at: oaCreated },
  { id: 'msg-oa-2', conversation_id: convOaId, sender_id: 'user-seed-owner', kind: 'text', text: 'Hello Aditi, I lost my silver Casio vintage watch in the mechanical workshop.', created_at: getPastDate(0, 3, 14, 30) },
  { id: 'msg-oa-3', conversation_id: convOaId, sender_id: 'user-seed-aditi', kind: 'text', text: 'Hi! Can you confirm if the clasp pin has a slight bend on the left?', created_at: getPastDate(0, 3, 15) },
  { id: 'msg-oa-4', conversation_id: convOaId, sender_id: 'user-seed-owner', kind: 'text', text: 'Yes, exactly! The pin has a small bend on the left side.', created_at: getPastDate(0, 3, 15, 30) },
  { id: 'msg-oa-5', conversation_id: convOaId, sender_id: null, kind: 'system', text: 'The finder confirmed this is a match.', created_at: oaMatched },
  { id: 'msg-oa-6', conversation_id: convOaId, sender_id: 'user-seed-aditi', kind: 'text', text: 'Confirmed! My WhatsApp number is unlocked for you now so we can meet up.', created_at: getPastDate(0, 3, 16) },
  { id: 'msg-oa-7', conversation_id: convOaId, sender_id: 'user-seed-owner', kind: 'text', text: 'Thanks a lot Aditi, sending you a WhatsApp text right now!', created_at: getPastDate(0, 3, 16, 15) },
];

for (const m of oaMessages) {
  insertMsgStmt.run(m.id, m.conversation_id, m.sender_id, m.kind, m.text, m.created_at);
}

insertFbStmt.run('fb-oa-1', convOaId, 'user-seed-aditi', 'match', 'matched', 'Verified bent clasp pin and workshop location', oaMatched);
insertNotifStmt.run('notif-oa-1', 'user-seed-owner', 'match', 'Match Confirmed!', 'Aditi Sharma confirmed your "Silver Casio Vintage Watch" is a match! Contact unlocked.', `/people?chat=${convOaId}`, 0, oaMatched);

// -------------------------------------------------------------
// 7. Owner with Kabir Mehta on HP Charger
// Status: 'returned' (Case closed history on Profile)
// -------------------------------------------------------------
const convOkId = 'conv-seed-owner-kabir-charger';
const okCreated = getPastDate(0, 8, 12);
const okMatched = getPastDate(0, 8, 15);
const okReturned = getPastDate(0, 9, 14);

insertConvStmt.run(
  convOkId,
  'item-seed-owner-charger',
  null,
  'user-seed-owner',
  'user-seed-kabir',
  'returned',
  okCreated,
  okReturned,
  okMatched,
  okReturned
);

const okMessages = [
  { id: 'msg-ok-1', conversation_id: convOkId, sender_id: null, kind: 'system', text: 'Chat started', created_at: okCreated },
  { id: 'msg-ok-2', conversation_id: convOkId, sender_id: 'user-seed-owner', kind: 'text', text: 'Hi Kabir, I left my 65W HP Type-C charger on table 4 in the library.', created_at: getPastDate(0, 8, 12, 30) },
  { id: 'msg-ok-3', conversation_id: convOkId, sender_id: 'user-seed-kabir', kind: 'text', text: 'Hi! Yes, found it plugged into the floor socket. It has a small piece of red tape near the adapter.', created_at: getPastDate(0, 8, 13) },
  { id: 'msg-ok-4', conversation_id: convOkId, sender_id: 'user-seed-owner', kind: 'text', text: "Yes, that's my tape so nobody takes it by mistake!", created_at: getPastDate(0, 8, 13, 30) },
  { id: 'msg-ok-5', conversation_id: convOkId, sender_id: null, kind: 'system', text: 'The finder confirmed this is a match.', created_at: okMatched },
  { id: 'msg-ok-6', conversation_id: convOkId, sender_id: 'user-seed-owner', kind: 'text', text: 'Met with Kabir and collected the charger. Marking returned!', created_at: okReturned },
  { id: 'msg-ok-7', conversation_id: convOkId, sender_id: null, kind: 'system', text: 'The owner confirmed the item was returned. +50 points to the finder.', created_at: okReturned },
];

for (const m of okMessages) {
  insertMsgStmt.run(m.id, m.conversation_id, m.sender_id, m.kind, m.text, m.created_at);
}

insertFbStmt.run('fb-ok-1', convOkId, 'user-seed-kabir', 'match', 'matched', 'Verified red tape marking on charger', okMatched);
insertFbStmt.run('fb-ok-2', convOkId, 'user-seed-owner', 'return', 'returned', 'Handed over at library entrance', okReturned);

insertNotifStmt.run('notif-ok-1', 'user-seed-owner', 'returned', 'Item Returned', 'You confirmed the return of "Black HP Laptop Charger 65W" with Kabir Mehta.', `/people?chat=${convOkId}`, 1, okReturned);

console.log('✅ Seeded demo conversations, messages, feedback, and notifications for owner and founder.');
console.log('\n🎉 FindBack database seeding complete!');
