import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { sound } from "../utils/sound";

const AppContext = createContext(null);

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

export function AppProvider({ children }) {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [pointsLedger, setPointsLedger] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

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

  async function addItem(newItemData) {
    if (newItemData instanceof FormData) {
      return api.upload("/items", newItemData);
    }
    const formData = new FormData();
    Object.entries(newItemData).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        formData.append(k, v);
      }
    });
    return api.upload("/items", formData);
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
    return res;
  }

  // Decision: Return
  async function makeReturnDecision(chatId, decision, explanation) {
    const body = { decision };
    if (explanation) body.explanation = explanation;
    const res = await api.post(`/conversations/${chatId}/return`, body);
    sound.playSuccess();

    try {
      const updatedConv = await api.get(`/conversations/${chatId}`);
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? adaptConversation(updatedConv, c.messages) : c))
      );
    } catch {}
    loadConversations();

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

  function updateUser(updates) {
    setUser((prev) => {
      const base = prev || { name: "Student", email: "student@campus.edu" };
      const updated =
        typeof updates === "function" ? updates(base) : { ...base, ...updates };
      return updated;
    });
  }

  function logout() {
    localStorage.removeItem("lf_token");
    setUser(null);
    setUserPoints(0);
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
      makeMatchDecision,
      makeReturnDecision,
      loadConversations,
      isPeopleActive,
      setIsPeopleActive,
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
    [
      items,
      user,
      notifications,
      userPoints,
      pointsLedger,
      conversations,
      activeChatId,
      isPeopleActive,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside an AppProvider");
  return ctx;
}
