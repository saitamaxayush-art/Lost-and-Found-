// backend/src/lib/formatConversation.js
// -------------------------------------------------------------
// This helper formats a conversation object for ONE specific viewer.
//
// Privacy & Contact Reveal Rule (enforced HERE and nowhere else):
// - otherParty.whatsapp and otherParty.campus are included ONLY for the owner
//   (the person who lost the item), and ONLY when status is 'matched' or 'returned'.
// - In every other case (while chatting, if rejected, or for the finder),
//   they are strictly ABSENT.
// - The owner's contact information is NEVER revealed to the finder in this version.
// -------------------------------------------------------------

import db from '../db.js';

/**
 * Computes user initials (e.g. "Alex Supertester" -> "AS", "Jordan" -> "J")
 *
 * @param {string} name - Full user name
 * @returns {string} 1-2 uppercase characters
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .map(p => (p[0] ? p[0].toUpperCase() : ''))
    .slice(0, 2)
    .join('');
}

/**
 * Builds the conversation response shape matching BACKEND_SPEC.md.
 *
 * @param {object} conv - Raw row from conversations table
 * @param {string} viewerUserId - ID of currently authenticated viewer
 * @returns {object} Formatted conversation object
 */
export function formatConversation(conv, viewerUserId) {
  if (!conv) return null;

  const isOwner = conv.owner_id === viewerUserId;
  const myRole = isOwner ? 'owner' : 'finder';

  // 1. Fetch item details (the found item that this chat is about)
  const itemRow = db.prepare(`
    SELECT id, description, category, location, date, image_path, status
    FROM items
    WHERE id = ?
  `).get(conv.found_item_id);

  let item = null;
  if (itemRow) {
    let img = null;
    if (itemRow.image_path) {
      img = itemRow.image_path.startsWith('/') ? itemRow.image_path : `/${itemRow.image_path}`;
    }
    item = {
      id: itemRow.id,
      description: itemRow.description,
      category: itemRow.category,
      location: itemRow.location,
      date: itemRow.date,
      image: img,
      status: itemRow.status,
    };
  }

  // 2. Fetch the other party's profile details
  const otherUserId = isOwner ? conv.finder_id : conv.owner_id;
  const otherUser = db.prepare(`
    SELECT id, name, campus, whatsapp
    FROM users
    WHERE id = ?
  `).get(otherUserId);

  const otherName = otherUser ? otherUser.name : 'Unknown User';
  const otherParty = {
    name: otherName,
    initials: getInitials(otherName),
  };

  // CONTACT REVEAL RULE:
  // otherParty.whatsapp and otherParty.campus are included ONLY for the owner,
  // and ONLY when the conversation status is 'matched' or 'returned'.
  if (isOwner && (conv.status === 'matched' || conv.status === 'returned') && otherUser) {
    if (otherUser.campus) otherParty.campus = otherUser.campus;
    if (otherUser.whatsapp) otherParty.whatsapp = otherUser.whatsapp;
  }

  // 3. Fetch the last message in this conversation (if any)
  const lastMsgRow = db.prepare(`
    SELECT text, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(conv.id);

  const lastMessage = lastMsgRow
    ? { text: lastMsgRow.text, createdAt: lastMsgRow.created_at }
    : null;

  // 4. Determine actionable decision buttons
  // canDecideMatch is true only for the finder while status is chatting
  const canDecideMatch = Boolean(myRole === 'finder' && conv.status === 'chatting');

  // canDecideReturn is true only for the owner while status is matched
  const canDecideReturn = Boolean(myRole === 'owner' && conv.status === 'matched');

  return {
    id: conv.id,
    status: conv.status,
    myRole,
    item,
    otherParty,
    lastMessage,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
    canDecideMatch,
    canDecideReturn,
  };
}
