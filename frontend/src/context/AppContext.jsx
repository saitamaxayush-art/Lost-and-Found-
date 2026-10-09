import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedItems } from "../data/mockItems";
import { INITIAL_USER_ITEMS, INITIAL_POINTS_LEDGER } from "../data/profileData";
import { sound } from "../utils/sound";

const AppContext = createContext(null);

const ITEMS_KEY = "lf_items_v3";
const USER_KEY = "lf_user";
const NOTIF_KEY = "lf_notifications";
const POINTS_KEY = "lf_points_ledger_v1";

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
  const [notifications, setNotifications] = useState(() => loadFromStorage(NOTIF_KEY, []));
  const [pointsLedger, setPointsLedger] = useState(() =>
    loadFromStorage(POINTS_KEY, INITIAL_POINTS_LEDGER)
  );

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

  // Award 50 points when an item reported by user is returned to the correct owner
  function returnItem(id, recipientName = "Verified Owner", options = {}) {
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
          returnedTo: recipientName,
          returnNotes: `Handover verified and completed with ${recipientName}.`,
          pointsAwarded: 50,
        };
      })
    );

    // Record 50 points transaction in points ledger
    const tx = {
      id: `tx-${Date.now()}`,
      date: today,
      itemId: id,
      itemTitle: targetItem?.description?.slice(0, 48) || "Reported Item",
      role: targetItem?.type === "found" ? "Finder (Reported Found)" : "Reporter (Reported Lost)",
      recipient: recipientName,
      points: 50,
      status: "Credited",
      note: "Item returned to correct user (+50 pts awarded)",
    };

    setPointsLedger((prev) => [tx, ...prev]);

    // Play celebration audio & trigger notification (only if not silent)
    if (!options?.silent) {
      try {
        sound.playSuccess();
      } catch {}
    }

    const note = {
      id: `notif-${Date.now()}`,
      message: `Success: +50 Points awarded for returning "${targetItem?.description?.slice(0, 32) || "item"}" to ${recipientName}.`,
      createdAt: Date.now(),
    };
    setNotifications((prev) => [note, ...prev]);

    return tx;
  }

  // Confirmation when a user's lost item is safely returned to them
  function confirmLostItemReturned(id, options = {}) {
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
          returnNotes: "Confirmed receipt of lost item. Case closed successfully.",
          pointsAwarded: 50,
        };
      })
    );

    const tx = {
      id: `tx-${Date.now()}`,
      date: today,
      itemId: id,
      itemTitle: targetItem?.description?.slice(0, 48) || "Lost Item",
      role: "Reporter (Reported Lost)",
      recipient: "Self (Received back safely)",
      points: 50,
      status: "Credited",
      note: "Lost item reunited successfully (+50 pts)",
    };

    setPointsLedger((prev) => [tx, ...prev]);

    if (!options?.silent) {
      try {
        sound.playSuccess();
      } catch {}
    }

    const note = {
      id: `notif-${Date.now()}`,
      message: `Report resolved: Your report is closed and +50 karma points have been credited.`,
      createdAt: Date.now(),
    };
    setNotifications((prev) => [note, ...prev]);

    return tx;
  }

  function login(nameOrProfile, email) {
    setUser(
      typeof nameOrProfile === "object" && nameOrProfile !== null
        ? nameOrProfile
        : { name: nameOrProfile, email }
    );
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
      returnItem,
      confirmLostItemReturned,
      user,
      login,
      logout,
      userPoints,
      pointsLedger,
      notifications,
      dismissNotifications,
    }),
    [items, user, notifications, userPoints, pointsLedger]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside an AppProvider");
  return ctx;
}
