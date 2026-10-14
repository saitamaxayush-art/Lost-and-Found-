import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp, adaptConversation } from "../context/AppContext";
import api from "../api/client";
import Nav from "../components/landing/Nav";
import LoginModal from "../components/landing/LoginModal";

import ConversationList from "../components/people/ConversationList";
import Thread from "../components/people/Thread";
import ItemContextPanel from "../components/people/ItemContextPanel";

import "../styles/landing.css";
import "../styles/sections.css";
import "../styles/people.css";

export default function People() {
  const {
    conversations,
    setConversations,
    activeChatId,
    setActiveChatId,
    sendMessage,
    makeMatchDecision,
    makeReturnDecision,
    setIsPeopleActive,
    items,
    user,
  } = useApp();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Mobile / Tablet pane views
  // On mobile (< 768px): "list" | "thread"
  const [mobilePane, setMobilePane] = useState("list");
  // On tablet / mobile: slide-over context panel open/close
  const [isSlideContextOpen, setIsSlideContextOpen] = useState(false);

  useEffect(() => {
    document.title = "People & Messaging — FindBack";
  }, []);

  // Mark People page as active for background polling
  useEffect(() => {
    setIsPeopleActive(true);
    return () => setIsPeopleActive(false);
  }, [setIsPeopleActive]);

  // Read URL query parameter if present: e.g. /people?chat=3f92016c-...
  useEffect(() => {
    const chatParam = searchParams.get("chat");
    if (!chatParam) return;

    if (conversations.some((c) => c.id === chatParam)) {
      setActiveChatId(chatParam);
      setMobilePane("thread");
    } else if (localStorage.getItem("lf_token")) {
      // If not yet in conversations list, load directly
      api
        .get(`/conversations/${chatParam}`)
        .then((data) => {
          if (data) {
            const adapted = adaptConversation(data);
            setConversations((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev;
              return [adapted, ...prev];
            });
            setActiveChatId(data.id);
            setMobilePane("thread");
          }
        })
        .catch((err) => {
          console.error("Failed to load conversation from param:", err);
        });
    }
  }, [searchParams, conversations, setActiveChatId, setConversations]);

  // Selected active chat
  const activeChat = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || conversations[0] || null;
  }, [conversations, activeChatId]);

  // Real-time lookup of the linked item in items registry (fallback to activeChat.item)
  const linkedItem = useMemo(() => {
    if (!activeChat) return null;
    return items.find((it) => it.id === activeChat.itemId) || activeChat.item || null;
  }, [items, activeChat]);

  // The role comes strictly from conversation.myRole
  const effectiveRole = activeChat?.myRole || "finder";

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setMobilePane("thread");
    setIsSlideContextOpen(false);
  };

  const handleSendMessage = async (text) => {
    if (!text || !activeChat) return;
    return sendMessage(activeChat.id, text);
  };

  const handleMatch = async (decision, explanation) => {
    if (!activeChat) return;
    return makeMatchDecision(activeChat.id, decision, explanation);
  };

  const handleReturn = async (decision, explanation) => {
    if (!activeChat) return;
    return makeReturnDecision(activeChat.id, decision, explanation);
  };

  return (
    <div className="pp-page">
      <Nav goTo={(id) => navigate("/", { state: { scrollTo: id } })} onLogin={() => setLoginModalOpen(true)} />

      <div
        className={`pp-shell-container ${
          mobilePane === "thread" ? "show-thread" : "show-list"
        }`}
      >
        {/* Pane 1: Conversation List (340px) */}
        <ConversationList
          conversations={conversations}
          activeChatId={activeChat?.id}
          onSelectChat={handleSelectChat}
          items={items}
        />

        {/* Pane 2: Thread (flex) */}
        {activeChat ? (
          <Thread
            activeChat={activeChat}
            linkedItem={linkedItem}
            userName={user?.name || "You"}
            effectiveRole={effectiveRole}
            onSendMessage={handleSendMessage}
            onOpenContextPanel={() => setIsSlideContextOpen((prev) => !prev)}
            onBackToList={() => setMobilePane("list")}
          />
        ) : (
          <main className="pp-pane-thread" style={{ display: "grid", placeItems: "center" }}>
            <p style={{ color: "var(--ink-soft)" }}>Select a conversation to begin.</p>
          </main>
        )}

        {/* Pane 3: Item Context Panel (320px / Slide-over) */}
        {activeChat && (
          <ItemContextPanel
            activeChat={activeChat}
            linkedItem={linkedItem}
            effectiveRole={effectiveRole}
            onMatchDecision={handleMatch}
            onReturnDecision={handleReturn}
            onCloseMobile={() => setIsSlideContextOpen(false)}
            isSlideOpen={isSlideContextOpen}
          />
        )}
      </div>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
