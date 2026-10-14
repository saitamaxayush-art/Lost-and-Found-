import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { sound } from "../utils/sound";

const AppContext = createContext(null);

export const CATEGORIES = [
  "Electronics",
  "Wallets & Cards",
  "Keys",
  "Bags & Backpacks",
  "Documents & IDs",
  "Clothing & Accessories",
  "Books & Stationery",
  "Bottles & Containers",
  "Other",
];

export const STATUSES = ["Reported", "Matched", "Returned"];

export function adaptMessage(msg, myRole, otherPartyName = "Student") {
  const isSystem = msg.kind === "system" || !msg.senderId;
  const isMine = Boolean(msg.isMine);
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Just now";

  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    kind: msg.kind || "text",
    text: msg.text,
    createdAt: msg.createdAt,
    timestamp: msg.createdAt,
    time,
    isMine,
    sender: isSystem ? "System" : isMine ? "You" : otherPartyName,
    senderRole: isSystem ? "system" : isMine ? myRole : (myRole === "owner" ? "finder" : "owner"),
  };
}

export function adaptConversation(apiConv, existingMessages = []) {
  if (!apiConv) return null;
  const otherParty = apiConv.otherParty || {};
  const item = apiConv.item || {};
  const lastMsg = apiConv.lastMessage;
  const isOwner = apiConv.myRole === "owner";

  const messages = (existingMessages || []).map((m) =>
    adaptMessage(m, apiConv.myRole, otherParty.name)
  );

  const displayMessages =
    messages.length > 0
      ? messages
      : lastMsg
      ? [
          {
            id: `last-${apiConv.id}`,
            text: lastMsg.text,
            time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: lastMsg.createdAt,
            createdAt: lastMsg.createdAt,
            sender: "User",
            senderRole: "user",
            kind: "text",
          },
        ]
      : [];

  return {
    id: apiConv.id,
    status: apiConv.status,
    myRole: apiConv.myRole,
    canDecideMatch: Boolean(apiConv.canDecideMatch),
    canDecideReturn: Boolean(apiConv.canDecideReturn),
    otherParty: apiConv.otherParty,
    item: apiConv.item,
    createdAt: apiConv.createdAt,
    updatedAt: apiConv.updatedAt,
    participantName: otherParty.name || "Student",
    participantDepartment: otherParty.campus || "Campus Network",
    participantAvatar: otherParty.initials || "?",
    participantAvatarImage: null,
    participantMaskedContact: otherParty.whatsapp || "+91 ••••• •••••",
    itemId: item.id || null,
    itemTitle: item.description || "Reported Item",
    itemCategory: item.category || "General",
    itemLocation: item.location || "Campus premises",
    itemDate: item.date || "Recently",
    itemImage: item.image || null,
    itemType: item.type || "found",
    itemStatus: apiConv.status === "matched" ? "Matched" : apiConv.status === "returned" ? "Returned" : "Reported",
    userRoleInTransaction: apiConv.myRole || (isOwner ? "owner" : "finder"),
    lastActivity: apiConv.updatedAt || apiConv.createdAt || Date.now(),
    unreadCount: 0,
    messages: displayMessages,
  };
}

export function adaptMyItem(apiItem) {
  if (!apiItem) return null;
  const statusCap =
    apiItem.status === "returned"
      ? "Returned"
      : apiItem.status === "matched"
      ? "Matched"
      : "Reported";
  const isReturned = apiItem.status === "returned";
  const isMatched = apiItem.status === "matched" || isReturned;

  return {
    ...apiItem,
    status: statusCap,
    isReturned,
    hasMatch: isMatched,
    locationLost: apiItem.type === "lost" ? apiItem.location : undefined,
    locationFound: apiItem.type === "found" ? apiItem.location : undefined,
    reportingDate: apiItem.date,
    reportingState: isReturned
      ? "Returned & Closed"
      : isMatched
      ? "Match Confirmed"
      : "Active in Campus Registry",
    returnedDate: apiItem.returnedAt
      ? new Date(apiItem.returnedAt).toISOString().slice(0, 10)
      : isReturned
      ? apiItem.date
      : null,
    isUserItem: true,
  };
}

export function adaptLeaderboard(apiLeaderboard, currentUser) {
  if (!Array.isArray(apiLeaderboard)) return [];
  let foundCurrentUser = false;

  const list = apiLeaderboard.map((u, idx) => {
    const isCurrentUser = Boolean(
      currentUser &&
        (u.name?.toLowerCase() === currentUser.name?.toLowerCase() ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()))
    );
    if (isCurrentUser) foundCurrentUser = true;
    return {
      rank: idx + 1,
      name: isCurrentUser ? currentUser.name || u.name : u.name,
      department: u.campus || "Main Campus",
      campus: u.campus || "Main Campus",
      points: isCurrentUser ? (currentUser.points ?? u.points) : u.points,
      isCurrentUser,
      avatarImage: null,
      badge:
        u.points >= 300
          ? "Campus Guardian"
          : u.points >= 150
          ? "Gold Helper"
          : "Active Member",
    };
  });

  if (currentUser && !foundCurrentUser) {
    const pts = currentUser.points || 0;
    list.push({
      name: currentUser.name || "You",
      department: currentUser.campus || "Main Campus",
      campus: currentUser.campus || "Main Campus",
      points: pts,
      isCurrentUser: true,
      avatarImage: null,
      badge:
        pts >= 300
          ? "Campus Guardian"
          : pts >= 150
          ? "Gold Helper"
          : "Active Member",
    });
    list.sort((a, b) => b.points - a.points);
    return list.map((e, idx) => ({ ...e, rank: idx + 1 }));
  }

  return list;
}

export function adaptNotification(n) {
  let chatId = null;
  if (n.link && n.link.includes("chat=")) {
    chatId = n.link.split("chat=")[1];
  }
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    chatId,
    read: Boolean(n.read),
    createdAt: n.created_at || n.createdAt || Date.now(),
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [myItems, setMyItems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [statsVersion, setStatsVersion] = useState(0);

  // Restore authenticated session on startup if token exists
  useEffect(() => {
    const token = localStorage.getItem("lf_token");
    if (!token) return;

    api
      .get("/me")
      .then((userData) => {
        setUser(userData);
        setUserPoints(userData.points || 0);
      })
      .catch((err) => {
        console.error("Failed to restore user session:", err);
        localStorage.removeItem("lf_token");
        setUser(null);
        setUserPoints(0);
      });
  }, []);

  // Load user's own items from /api/items/mine
  const loadMyItems = async () => {
    if (!localStorage.getItem("lf_token")) {
      setMyItems([]);
      return;
    }
    try {
      const data = await api.get("/items/mine");
      if (Array.isArray(data)) {
        setMyItems(data.map(adaptMyItem));
      }
    } catch (err) {
      console.error("Failed to load user items:", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyItems();
    } else {
      setMyItems([]);
    }
  }, [user]);

  // Load campus leaderboard from /api/leaderboard
  const loadLeaderboard = async () => {
    try {
      const data = await api.get("/leaderboard");
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const adaptedLeaderboard = useMemo(() => {
    return adaptLeaderboard(leaderboard, user);
  }, [leaderboard, user]);

  // Load notifications from /api/notifications and poll every 15s
  const loadNotifications = async () => {
    if (!localStorage.getItem("lf_token")) {
      setNotifications([]);
      return;
    }
    try {
      const data = await api.get("/notifications");
      if (Array.isArray(data)) {
        setNotifications(data.map(adaptNotification));
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    return () => clearInterval(timer);
  }, [user]);

  async function dismissNotifications() {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  }

  // Points ledger derived from returned items
  const pointsLedger = useMemo(() => {
    const returnedItems = myItems.filter((i) => i.status === "Returned" || i.isReturned);
    return returnedItems.map((item) => ({
      id: `tx-${item.id}`,
      itemTitle: item.description,
      role: item.type === "found" ? "Finder" : "Owner",
      recipient: "Campus Member",
      date: item.returnedDate || item.date || "Recently",
      points: 50,
    }));
  }, [myItems]);

  async function addItem(newItemData) {
    let res;
    if (newItemData instanceof FormData) {
      res = await api.upload("/items", newItemData);
    } else {
      const formData = new FormData();
      Object.entries(newItemData).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, v);
        }
      });
      res = await api.upload("/items", formData);
    }
    loadMyItems();
    return res;
  }

  function updateItemStatus(id, status) {
    setMyItems((prev) =>
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

  const [isPeopleActive, setIsPeopleActive] = useState(false);

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Load conversations from backend
  const loadConversations = async () => {
    if (!localStorage.getItem("lf_token")) return;
    try {
      const data = await api.get("/conversations");
      if (!Array.isArray(data)) return;
      setConversations((prev) => {
        const msgMap = new Map();
        prev.forEach((c) => {
          if (c.messages && c.messages.length > 0 && !c.messages[0].id?.startsWith("last-")) {
            msgMap.set(c.id, c.messages);
          }
        });
        return data.map((apiConv) => adaptConversation(apiConv, msgMap.get(apiConv.id)));
      });
      if (!activeChatId && data.length > 0) {
        setActiveChatId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  // Poll conversations every 8 seconds while People page is open
  useEffect(() => {
    if (!isPeopleActive || !user) return;
    loadConversations();
    const timer = setInterval(loadConversations, 8000);
    return () => clearInterval(timer);
  }, [isPeopleActive, user]);

  // Poll messages for active chat every 3 seconds (?after=<last message createdAt>)
  useEffect(() => {
    if (!activeChatId || !isPeopleActive || !user) return;

    let isMounted = true;

    const fetchMessages = async () => {
      const conv = conversationsRef.current.find((c) => c.id === activeChatId);
      const existingMsgs = conv?.messages?.filter((m) => !m.id?.startsWith("last-")) || [];
      const lastCreatedAt = existingMsgs.length > 0 ? existingMsgs[existingMsgs.length - 1].createdAt : null;

      const url = lastCreatedAt
        ? `/conversations/${activeChatId}/messages?after=${encodeURIComponent(lastCreatedAt)}`
        : `/conversations/${activeChatId}/messages`;

      try {
        const newMsgs = await api.get(url);
        if (!isMounted || !Array.isArray(newMsgs) || newMsgs.length === 0) return;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeChatId) return c;
            const currentList = c.messages?.filter((m) => !m.id?.startsWith("last-")) || [];
            const existingIds = new Set(currentList.map((m) => m.id));
            const toAdd = newMsgs
              .filter((m) => !existingIds.has(m.id))
              .map((m) => adaptMessage(m, c.myRole, c.participantName));
            if (toAdd.length === 0) return c;
            return {
              ...c,
              lastActivity: toAdd[toAdd.length - 1]?.createdAt || Date.now(),
              messages: [...currentList, ...toAdd],
            };
          })
        );
      } catch (err) {
        console.error("Failed to poll messages:", err);
      }
    };

    fetchMessages();
    const timer = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeChatId, isPeopleActive, user]);

  // Send message in People chat
  async function sendMessage(chatId, text) {
    if (!text || !text.trim()) return;
    const res = await api.post(`/conversations/${chatId}/messages`, { text: text.trim() });
    sound.playUiClick();

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const currentList = c.messages?.filter((m) => !m.id?.startsWith("last-")) || [];
        const adapted = adaptMessage(res, c.myRole, c.participantName);
        return {
          ...c,
          lastActivity: res.createdAt || Date.now(),
          messages: [...currentList, adapted],
        };
      })
    );
    return res;
  }

  // Decision: Match
  async function makeMatchDecision(chatId, decision, explanation) {
    const body = { decision };
    if (explanation) body.explanation = explanation;
    const res = await api.post(`/conversations/${chatId}/match`, body);
    sound.playSuccess();

    try {
      const updatedConv = await api.get(`/conversations/${chatId}`);
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? adaptConversation(updatedConv, c.messages) : c))
      );
    } catch {}
    loadConversations();
    loadMyItems();
    return res;
  }

  // Decision: Return
  async function makeReturnDecision(chatId, decision, explanation) {
    const body = { decision };
    if (explanation) body.explanation = explanation;
    const res = await api.post(`/conversations/${chatId}/return`, body);
    sound.playSuccess();

    // Bump statsVersion so HistorySection refetches without page reload
    if (decision === "returned") {
      setStatsVersion((v) => v + 1);
    }

    try {
      const updatedConv = await api.get(`/conversations/${chatId}`);
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? adaptConversation(updatedConv, c.messages) : c))
      );
    } catch {}
    loadConversations();
    loadMyItems();
    loadLeaderboard();
    loadNotifications();

    api
      .get("/me")
      .then((userData) => {
        setUser(userData);
        setUserPoints(userData.points || 0);
      })
      .catch(() => {});

    return res;
  }

  // Backwards compatibility wrappers
  const markItemMatched = makeMatchDecision;
  const requestMarkAsMatched = () => {};
  const markItemReturned = makeReturnDecision;
  const confirmLostItemReturned = makeReturnDecision;
  const returnItem = makeReturnDecision;

  async function login(nameOrProfile, email) {
    const payload =
      typeof nameOrProfile === "object" && nameOrProfile !== null
        ? {
            name: nameOrProfile.name,
            email: nameOrProfile.email,
            whatsapp: nameOrProfile.whatsapp,
            campus: nameOrProfile.campus,
          }
        : {
            name: nameOrProfile,
            email,
          };

    const data = await api.post("/auth/login", payload);
    if (data.token) {
      localStorage.setItem("lf_token", data.token);
    }
    setUser(data.user);
    setUserPoints(data.user?.points || 0);
    return data.user;
  }

  async function updateUser(updates) {
    const patchPayload = {};
    if (updates.name !== undefined) patchPayload.name = updates.name;
    if (updates.whatsapp !== undefined) patchPayload.whatsapp = updates.whatsapp;
    if (updates.campus !== undefined) patchPayload.campus = updates.campus;

    let serverUser = null;
    if (Object.keys(patchPayload).length > 0 && localStorage.getItem("lf_token")) {
      serverUser = await api.patch("/me", patchPayload);
    }

    // Refresh user from /me
    try {
      if (localStorage.getItem("lf_token")) {
        const freshUser = await api.get("/me");
        if (freshUser) {
          serverUser = freshUser;
        }
      }
    } catch (e) {
      console.warn("Failed to refresh user:", e);
    }

    setUser((prev) => {
      const merged = { ...prev, ...updates, ...(serverUser || {}) };
      return merged;
    });

    if (serverUser?.points !== undefined) {
      setUserPoints(serverUser.points);
    }

    loadLeaderboard();
    return serverUser;
  }

  function logout() {
    localStorage.removeItem("lf_token");
    setUser(null);
    setUserPoints(0);
    setMyItems([]);
    setNotifications([]);
    setConversations([]);
  }

  const value = useMemo(
    () => ({
      items: myItems,
      myItems,
      loadMyItems,
      addItem,
      updateItemStatus,
      markItemMatched,
      requestMarkAsMatched,
      markItemReturned,
      returnItem,
      confirmLostItemReturned,
      makeMatchDecision,
      makeReturnDecision,
      loadConversations,
      isPeopleActive,
      setIsPeopleActive,
      user,
      login,
      updateUser,
      logout,
      userPoints: user?.points ?? userPoints ?? 0,
      pointsLedger,
      leaderboard: adaptedLeaderboard,
      loadLeaderboard,
      notifications,
      dismissNotifications,
      conversations,
      setConversations,
      activeChatId,
      setActiveChatId,
      sendMessage,
      statsVersion,
      bumpStatsVersion: () => setStatsVersion((v) => v + 1),
    }),
    [
      myItems,
      user,
      notifications,
      userPoints,
      pointsLedger,
      adaptedLeaderboard,
      conversations,
      activeChatId,
      isPeopleActive,
      statsVersion,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside an AppProvider");
  return ctx;
}
