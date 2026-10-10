import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedItems } from "../data/mockItems";
import {
  INITIAL_USER_ITEMS,
  INITIAL_POINTS_LEDGER,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_CONVERSATIONS,
} from "../data/profileData";
import { sound } from "../utils/sound";

const AppContext = createContext(null);

const ITEMS_KEY = "lf_items_v4";
const USER_KEY = "lf_user";
const NOTIF_KEY = "lf_notifications_v3";
const POINTS_KEY = "lf_points_ledger_v1";
const CONV_KEY = "lf_conversations_v3";

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Very simple "matching engine": two opposite-type items are a likely match
// if they share a category and at least one meaningful word in their
// descriptions overlaps.
function findLikelyMatch(newItem, allItems) {
  const oppositeType = newItem.type === "lost" ? "found" : "lost";
  const newWords = new Set(
    newItem.description
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3)
  );

  return allItems.find((item) => {
    if (item.type !== oppositeType) return false;
    if (item.category !== newItem.category) return false;
    const itemWords = item.description.toLowerCase().split(/[^a-z0-9]+/);
    return itemWords.some((w) => w.length > 3 && newWords.has(w));
  });
}

export function AppProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = loadFromStorage(ITEMS_KEY, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    // Combine seed items and user items
    return [...INITIAL_USER_ITEMS, ...seedItems];
  });

  const [user, setUser] = useState(() => loadFromStorage(USER_KEY, null));
  const [notifications, setNotifications] = useState(() =>
    loadFromStorage(NOTIF_KEY, DEFAULT_NOTIFICATIONS)
  );
  const [pointsLedger, setPointsLedger] = useState(() =>
    loadFromStorage(POINTS_KEY, INITIAL_POINTS_LEDGER)
  );
  const [conversations, setConversations] = useState(() =>
    loadFromStorage(CONV_KEY, DEFAULT_CONVERSATIONS)
  );
  const [activeChatId, setActiveChatId] = useState(() => {
    return DEFAULT_CONVERSATIONS?.[0]?.id || "chat-wallet-1";
  });

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(POINTS_KEY, JSON.stringify(pointsLedger));
  }, [pointsLedger]);

  useEffect(() => {
    localStorage.setItem(CONV_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // Compute user points dynamically: 50 points per completed return transaction
  const userPoints = useMemo(() => {
    return pointsLedger.reduce((sum, tx) => sum + (Number(tx.points) || 0), 0);
  }, [pointsLedger]);

  function addItem(newItemData) {
    const dateStr = newItemData.date || new Date().toISOString().slice(0, 10);
    const match = findLikelyMatch({ ...newItemData, type: newItemData.type }, items);

    const isLost = newItemData.type === "lost";

    const newItem = {
      id: `item-${Date.now()}`,
      status: match ? "Matched" : "Reported",
      createdAt: Date.now(),
      reporter: user?.email || user?.whatsapp || user?.name || "demo@student.edu",
      reporterName: user?.name || "Campus Student",
      isUserItem: true,
      ...newItemData,

      // Stage tracking properties
      // For Lost:
      reportingDate: dateStr,
      reportingState: "Active in Campus Registry",
      hasMatch: !!match,
      matchedProduct: match
        ? {
            id: match.id,
            title: match.description,
            category: match.category,
            foundDate: match.date || dateStr,
            locationFound: match.locationFound || "Campus premises",
            finderName: match.reporterName || "Campus Finder",
            finderCampus: "Campus Network",
            finderMaskedContact: match.reporter || "+91 ••••• •••••",
            similarityScore: "94% description match",
            notes: "Matched with report registered on campus board.",
          }
        : null,

      // For Found:
      foundDate: dateStr,
      foundTime: "Just now",
      foundState: "Reported & Safely secured",
      matchedUsersCount: match ? 1 : 0,
      matchedUsers: match
        ? [
            {
              id: `claimant-${Date.now()}`,
              name: match.reporterName || "Matching Student",
              department: "Registered Campus Member",
              campus: "Main Campus",
              maskedContact: match.reporter || "+91 98••• •••••",
              matchDate: dateStr,
              claimDetails: match.description,
              verified: false,
            },
          ]
        : [],

      // Common stage 3:
      isReturned: false,
      returnedDate: null,
      returnedTo: null,
      returnNotes: null,
    };

    setItems((prev) => [newItem, ...prev]);

    if (match) {
      const note = {
        id: `notif-${Date.now()}`,
        message: `Match alert! Your ${newItem.type} report ("${newItem.category}") matched with another report on campus.`,
        createdAt: Date.now(),
      };
      setNotifications((prev) => [note, ...prev]);
    }

    return { item: newItem, match };
  }

  function updateItemStatus(id, status) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const isRet = status === "Returned";
        return {
          ...it,
          status,
          isReturned: isRet ? true : it.isReturned,
          returnedDate: isRet ? (it.returnedDate || new Date().toISOString().slice(0, 10)) : it.returnedDate,
        };
      })
    );
  }

  // Send message in People chat
  function sendMessage(chatId, text, senderName = "You", senderRole = "owner") {
    if (!text || !text.trim()) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: senderName,
      senderRole,
      text: text.trim(),
      time: nowTime,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        return {
          ...c,
          lastActivity: Date.now(),
          messages: [...(c.messages || []), newMsg],
        };
      })
    );
  }

  // 1. Mark as Matched: User who found the item has access to mark as matched (and not as returned)
  function markItemMatched(id, claimantName = "Verified Student") {
    let targetItem = null;
    const today = new Date().toISOString().slice(0, 10);

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        targetItem = it;
        const updatedUsers = (it.matchedUsers || []).map((u) =>
          u.name === claimantName || !claimantName ? { ...u, verified: true } : u
        );

        return {
          ...it,
          status: "Matched",
          hasMatch: true,
          matchConfirmedDate: today,
          matchedUsersCount: Math.max(1, updatedUsers.length),
          matchedUsers:
            updatedUsers.length > 0
              ? updatedUsers
              : [
                  {
                    id: `claimant-${Date.now()}`,
                    name: claimantName,
                    department: "Registered Student",
                    campus: "Main Campus",
                    maskedContact: "+91 98••• •••••",
                    matchDate: today,
                    claimDetails: "Match confirmed by finder.",
                    verified: true,
                  },
                ],
        };
      })
    );

    const itemTitle = targetItem?.description?.slice(0, 42) || "Found Item";

    // Update associated conversation in People
    setConversations((prev) =>
      prev.map((c) => {
        if (c.itemId !== id) return c;
        const sysMsg = {
          id: `sys-${Date.now()}-match`,
          sender: "System",
          senderRole: "system",
          text: `Match approved by finder! Both parties have verified the description. Owner can now coordinate handover and mark as returned.`,
          time: "Just now",
          timestamp: Date.now(),
        };
        return {
          ...c,
          itemStatus: "Matched",
          lastActivity: Date.now(),
          messages: [...(c.messages || []), sysMsg],
        };
      })
    );

    const note = {
      id: `notif-${Date.now()}`,
      type: "matched",
      title: "Match Approved",
      message: `Item Matched: "${itemTitle}" marked as matched with ${claimantName}. Waiting for the user who has lost the item to mark as returned.`,
      createdAt: Date.now(),
      itemId: id,
    };
    setNotifications((prev) => [note, ...prev]);
  }

  // 2. Request Mark as Matched: The user who lost the item can request for mark as matched to the user who reported it
  function requestMarkAsMatched(id, finderName) {
    let targetItem = null;
    const today = new Date().toISOString().slice(0, 10);

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        targetItem = it;
        return {
          ...it,
          matchRequested: true,
          matchRequestedDate: today,
          matchRequestedTo: finderName || it.matchedProduct?.finderName || "Campus Finder",
        };
      })
    );

    const itemTitle = targetItem?.description?.slice(0, 42) || "Lost Item";
    const targetFinder = finderName || targetItem?.matchedProduct?.finderName || "Campus Finder";
    const requesterName = user?.name || "Lost Item Owner";
    let matchedChatId = `chat-${id}`;

    // Update or create conversation in People
    setConversations((prev) => {
      const existing = prev.find((c) => c.itemId === id);
      const sysMsg = {
        id: `sys-${Date.now()}-req`,
        sender: "System",
        senderRole: "system",
        text: `Match request submitted by owner (${requesterName}). Description is ready for verification.`,
        time: "Just now",
        timestamp: Date.now(),
      };

      if (existing) {
        matchedChatId = existing.id;
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                itemStatus: "Match Requested",
                lastActivity: Date.now(),
                messages: [...(c.messages || []), sysMsg],
              }
            : c
        );
      }

      // Create new chat with finder
      const newChat = {
        id: matchedChatId,
        participantName: targetFinder,
        participantDepartment: "Campus Finder / Helpdesk",
        participantAvatar: targetFinder.slice(0, 2).toUpperCase(),
        participantMaskedContact: targetItem?.matchedProduct?.finderMaskedContact || "+91 ••••• •••••",
        itemId: id,
        itemTitle: targetItem?.description || itemTitle,
        itemType: targetItem?.type || "lost",
        itemCategory: targetItem?.category || "General",
        itemStatus: "Match Requested",
        userRoleInTransaction: "owner",
        lastActivity: Date.now(),
        unreadCount: 0,
        messages: [
          sysMsg,
          {
            id: `msg-${Date.now()}-userreq`,
            sender: "You",
            senderRole: "owner",
            text: `Hi ${targetFinder}! I submitted a match request for my lost "${itemTitle}". Does the description match the found report?`,
            time: "Just now",
            timestamp: Date.now(),
          },
        ],
      };
      return [newChat, ...prev];
    });

    const note = {
      id: `notif-${Date.now()}`,
      type: "match_requested",
      title: `Match Request from ${requesterName}`,
      message: `Match Request from ${requesterName}: Requested to match with your found report "${itemTitle}". Open People to view description, chat, and approve.`,
      requesterName,
      chatId: matchedChatId,
      createdAt: Date.now(),
      itemId: id,
    };
    setNotifications((prev) => [note, ...prev]);
  }

  // 3. Mark as Returned: The user who has lost the item is the one who has access to mark as returned
  function markItemReturned(id, recipientName = "Verified Owner", options = {}) {
    const today = new Date().toISOString().slice(0, 10);
    let targetItem = null;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        targetItem = it;
        return {
          ...it,
          status: "Returned",
          isReturned: true,
          returnedDate: today,
          returnedTo: recipientName || it.matchedProduct?.finderName || "Campus Finder",
          returnNotes: "Confirmed returned by owner. Case closed successfully.",
          pointsAwarded: 50,
        };
      })
    );

    const itemTitle = targetItem?.description?.slice(0, 42) || "Reported Item";
    const finder = recipientName || targetItem?.matchedProduct?.finderName || "Campus Finder";

    // Award 50 points to finder
    const tx = {
      id: `tx-${Date.now()}`,
      date: today,
      itemId: id,
      itemTitle,
      role: targetItem?.type === "found" ? "Finder (Reported Found)" : "Reporter (Reported Lost)",
      recipient: finder,
      points: 50,
      status: "Credited",
      note: "Item returned & confirmed by owner (+50 pts awarded)",
    };

    setPointsLedger((prev) => [tx, ...prev]);

    // Update conversation in People
    setConversations((prev) =>
      prev.map((c) => {
        if (c.itemId !== id) return c;
        const sysMsg = {
          id: `sys-${Date.now()}-ret`,
          sender: "System",
          senderRole: "system",
          text: `Item successfully marked as returned by owner! Case closed. +50 karma points credited to finder.`,
          time: "Just now",
          timestamp: Date.now(),
        };
        return {
          ...c,
          itemStatus: "Returned",
          lastActivity: Date.now(),
          messages: [...(c.messages || []), sysMsg],
        };
      })
    );

    const note = {
      id: `notif-${Date.now()}`,
      type: "returned",
      title: "Item Returned",
      message: `Item Returned: "${itemTitle}" confirmed returned by owner. +50 points awarded to finder!`,
      createdAt: Date.now(),
      itemId: id,
    };
    setNotifications((prev) => [note, ...prev]);

    return tx;
  }

  // Backwards compatibility wrappers
  const confirmLostItemReturned = markItemReturned;
  const returnItem = markItemReturned;

  function login(nameOrProfile, email) {
    setUser(
      typeof nameOrProfile === "object" && nameOrProfile !== null
        ? nameOrProfile
        : { name: nameOrProfile, email }
    );
  }

  function updateUser(updates) {
    setUser((prev) => {
      const base = prev || { name: "Student", email: "student@campus.edu" };
      const updated =
        typeof updates === "function" ? updates(base) : { ...base, ...updates };
      return updated;
    });
  }

  function logout() {
    setUser(null);
  }

  function dismissNotifications() {
    setNotifications([]);
  }

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateItemStatus,
      markItemMatched,
      requestMarkAsMatched,
      markItemReturned,
      returnItem,
      confirmLostItemReturned,
      user,
      login,
      updateUser,
      logout,
      userPoints,
      pointsLedger,
      notifications,
      dismissNotifications,
      conversations,
      setConversations,
      activeChatId,
      setActiveChatId,
      sendMessage,
    }),
    [items, user, notifications, userPoints, pointsLedger, conversations, activeChatId]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside an AppProvider");
  return ctx;
}
