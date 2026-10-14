// backend/src/routes/stats.js
// -------------------------------------------------------------
// This file handles analytics and community leaderboard routes:
// - GET /api/stats       : Public recovery metrics and an 8-month trend of reported vs returned items
// - GET /api/leaderboard : Top 10 campus students ranked by points earned for returning lost items
// -------------------------------------------------------------

import { Router } from 'express';
import db from '../db.js';

const router = Router();

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// GET /api/stats
// Returns totals (reported, returned, successRate, avgDaysToReturn) and an 8-month breakdown
router.get('/stats', (req, res) => {
  const allItems = db.prepare(`
    SELECT created_at, returned_at, status
    FROM items
  `).all();

  const totalReported = allItems.length;
  const returnedItems = allItems.filter(
    item => item.status === 'returned' && item.returned_at
  );
  const totalReturned = returnedItems.length;

  // successRate: whole percentage of reported items that were returned
  const successRate = totalReported > 0
    ? Math.round((totalReturned / totalReported) * 100)
    : 0;

  // avgDaysToReturn: average duration in days rounded to one decimal place
  let avgDaysToReturn = 0;
  if (returnedItems.length > 0) {
    const totalDays = returnedItems.reduce((sum, item) => {
      const diffMs = Math.max(0, item.returned_at - item.created_at);
      return sum + diffMs / (1000 * 60 * 60 * 24);
    }, 0);
    avgDaysToReturn = Number((totalDays / returnedItems.length).toFixed(1));
  }

  // Generate 8 calendar month buckets ending with the current month, oldest first
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 to 11

  const monthlyBuckets = [];
  for (let i = 7; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const y = date.getFullYear();
    const m = date.getMonth();

    const startMs = new Date(y, m, 1).getTime();
    const endMs = new Date(y, m + 1, 1).getTime();

    monthlyBuckets.push({
      m: MONTH_NAMES[m],
      startMs,
      endMs,
      reported: 0,
      returned: 0,
    });
  }

  // Aggregate items into calendar month buckets
  for (const item of allItems) {
    // 1. Reported month is based on created_at
    const reportedBucket = monthlyBuckets.find(
      b => item.created_at >= b.startMs && item.created_at < b.endMs
    );
    if (reportedBucket) {
      reportedBucket.reported++;
    }

    // 2. Returned month is based on returned_at
    if (item.status === 'returned' && item.returned_at) {
      const returnedBucket = monthlyBuckets.find(
        b => item.returned_at >= b.startMs && item.returned_at < b.endMs
      );
      if (returnedBucket) {
        returnedBucket.returned++;
      }
    }
  }

  const monthly = monthlyBuckets.map(({ m, reported, returned }) => ({
    m,
    reported,
    returned,
  }));

  return res.json({
    totals: {
      reported: totalReported,
      returned: totalReturned,
      successRate,
      avgDaysToReturn,
    },
    monthly,
  });
});

// GET /api/leaderboard
// Returns top 10 users by points: { name, campus, points }
router.get('/leaderboard', (req, res) => {
  const topUsers = db.prepare(`
    SELECT name, campus, points
    FROM users
    ORDER BY points DESC, created_at ASC
    LIMIT 10
  `).all();

  return res.json(topUsers);
});

export default router;
