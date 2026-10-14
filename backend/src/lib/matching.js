// backend/src/lib/matching.js
// -------------------------------------------------------------
// HOW THE MATCHING ENGINE WORKS (Great for hackathon video demos!):
//
// When a student searches for an item or reports a lost item, we don't
// just look for exact sentences. Instead:
// 1. We tokenize the text: break sentences into clean keywords, drop punctuation,
//    and ignore unimportant "filler words" like "the", "near", "with", "lost", "found".
// 2. We score matches: count how many DISTINCT meaningful query words appear across
//    an item's description, category, and location.
// 3. We calculate match percentage: (matched words / total query words) * 100.
//    Items are then ranked by the highest score, followed by the newest reports.
// -------------------------------------------------------------

// List of common filler/stop words that shouldn't inflate search scores
const FILLER_WORDS = new Set([
  'the', 'and', 'with', 'near', 'from', 'lost', 'found', 'have', 'has', 'was',
  'for', 'this', 'that', 'item', 'some', 'into', 'onto', 'over', 'under', 'are',
  'were', 'been', 'about', 'above', 'after', 'again', 'all', 'any', 'because',
  'before', 'below', 'between', 'both', 'but', 'can', 'could', 'each', 'few',
  'had', 'her', 'here', 'him', 'his', 'how', 'its', 'just', 'more', 'most',
  'not', 'off', 'once', 'only', 'our', 'out', 'same', 'she', 'should', 'some',
  'such', 'than', 'their', 'them', 'then', 'there', 'these', 'they', 'too',
  'very', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'will', 'would', 'you', 'your'
]);

/**
 * Breaks a string of text into clean, distinct keyword tokens.
 * - Converts all letters to lowercase
 * - Splits along any non-alphanumeric characters (spaces, commas, symbols)
 * - Drops words shorter than 3 characters (e.g. "in", "at", "a")
 * - Drops filler words (e.g. "near", "with", "the")
 * - Removes duplicate words so each word only counts once
 *
 * @param {string} text - The input search query or description
 * @returns {string[]} An array of unique, meaningful keyword tokens
 */
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];

  const rawWords = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(w => w.trim());

  const meaningfulWords = rawWords.filter(word => {
    return word.length >= 3 && !FILLER_WORDS.has(word);
  });

  // Remove duplicates
  return Array.from(new Set(meaningfulWords));
}

/**
 * Scores an item against a list of query keywords.
 * Checks whether query words appear anywhere in the item's description,
 * category, or campus location.
 *
 * @param {string[]} queryWords - Array of cleaned query tokens
 * @param {object} item - Item object containing description, category, and location
 * @returns {{ score: number, matchedWords: string[], matchPercent: number }}
 */
export function scoreItem(queryWords, item) {
  if (!Array.isArray(queryWords) || queryWords.length === 0 || !item) {
    return { score: 0, matchedWords: [], matchPercent: 0 };
  }

  // Combine item text fields and extract unique words
  const combinedText = `${item.description || ''} ${item.category || ''} ${item.location || ''}`;
  const itemTokens = new Set(tokenize(combinedText));

  // Find which query words are present in the item
  const matchedWords = queryWords.filter(word => itemTokens.has(word));
  const score = matchedWords.length;
  const matchPercent = queryWords.length > 0
    ? Math.round((score / queryWords.length) * 100)
    : 0;

  return { score, matchedWords, matchPercent };
}
