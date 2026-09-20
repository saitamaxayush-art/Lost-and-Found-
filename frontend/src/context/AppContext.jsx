import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedItems } from "../data/mockItems";

const AppContext = createContext(null);

const ITEMS_KEY = "lf_items_v2";
const USER_KEY = "lf_user";
const NOTIF_KEY = "lf_notifications";

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
// descriptions overlaps. Good enough for a hackathon demo — swap this for a
// real backend matching endpoint later.
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
  const [items, setItems] = useState(() => loadFromStorage(ITEMS_KEY, seedItems));
  const [user, setUser] = useState(() => loadFromStorage(USER_KEY, null));
  const [notifications, setNotifications] = useState(() => loadFromStorage(NOTIF_KEY, []));

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications]);

  function addItem(newItemData) {
    const newItem = {
      id: `item-${Date.now()}`,
      status: "Reported",
      createdAt: Date.now(),
      reporter: user?.whatsapp || user?.email || "guest",
      ...newItemData,
    };

    const match = findLikelyMatch(newItem, items);

    setItems((prev) => [newItem, ...prev]);

    if (match) {
      const note = {
        id: `notif-${Date.now()}`,
        message: `Possible match: your ${newItem.type} report ("${newItem.category}") looks similar to a ${match.type} report already on the board.`,
        createdAt: Date.now(),
      };
      setNotifications((prev) => [note, ...prev]);
    }

    return { item: newItem, match };
  }

  function updateItemStatus(id, status) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  // login({ name, whatsapp, campus }) from the landing pop-up / login page.
  // Legacy call login(name, email) still works.
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
      user,
      login,
      logout,
      notifications,
      dismissNotifications,
    }),
    [items, user, notifications]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside an AppProvider");
  return ctx;
}
