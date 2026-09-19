// Seed data so the app isn't empty on first run.
// In a real app this would come from the backend/database instead.

export const CATEGORIES = [
  "Electronics",
  "Stationery",
  "Clothing",
  "ID Cards",
  "Accessories",
  "Books",
  "Other",
];

export const STATUSES = ["Reported", "Matched", "Returned"];

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const seedItems = [
  {
    id: "seed-1",
    type: "lost",
    description: "Black leather wallet with a college ID inside, lost near the library.",
    category: "ID Cards",
    date: daysAgo(3),
    status: "Reported",
    image: null,
    reporter: "demo@student.edu",
    createdAt: now - 3 * 86400000,
  },
  {
    id: "seed-2",
    type: "found",
    description: "Found a blue water bottle with stickers on it outside the canteen.",
    category: "Other",
    date: daysAgo(2),
    status: "Reported",
    image: null,
    reporter: "demo@student.edu",
    createdAt: now - 2 * 86400000,
  },
  {
    id: "seed-3",
    type: "lost",
    description: "Wired earphones (white), left them in the CS lab, room 204.",
    category: "Electronics",
    date: daysAgo(5),
    status: "Matched",
    image: null,
    reporter: "demo@student.edu",
    createdAt: now - 5 * 86400000,
  },
  {
    id: "seed-4",
    type: "found",
    description: "A grey hoodie found on the basketball court after evening practice.",
    category: "Clothing",
    date: daysAgo(1),
    status: "Reported",
    image: null,
    reporter: "demo@student.edu",
    createdAt: now - 1 * 86400000,
  },
];
