import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
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
    activeChatId,
    setActiveChatId,
    sendMessage,
    markItemMatched,
    requestMarkAsMatched,
    markItemReturned,
    items,
    user,
  } = useApp();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Perspective simulation mode: allow testing both roles
  const [perspectiveRole, setPerspectiveRole] = useState("auto"); // "auto" | "finder" | "owner"

  // Mobile / Tablet pane views
  // On mobile (< 768px): "list" | "thread"
  const [mobilePane, setMobilePane] = useState("list");
  // On tablet / mobile: slide-over context panel open/close
  const [isSlideContextOpen, setIsSlideContextOpen] = useState(false);

  useEffect(() => {
    document.title = "People & Messaging — FindBack";
  }, []);

  // Read URL query parameter if present: e.g. /people?chat=chat-wallet-1
  useEffect(() => {
    const chatParam = searchParams.get("chat");
    if (chatParam) {
      if (conversations.some((c) => c.id === chatParam)) {
        setActiveChatId(chatParam);
        setMobilePane("thread");
      }
    }
  }, [searchParams, conversations, setActiveChatId]);

  // Selected active chat
  const activeChat = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || conversations[0] || null;
  }, [conversations, activeChatId]);

  // Real-time lookup of the linked item in items registry
  const linkedItem = useMemo(() => {
    if (!activeChat) return null;
    return items.find((it) => it.id === activeChat.itemId) || null;
  }, [items, activeChat]);

  const effectiveRole =
    perspectiveRole === "auto"
      ? activeChat?.userRoleInTransaction || "finder"
      : perspectiveRole;

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setMobilePane("thread");
    setIsSlideContextOpen(false);
  };

  const handleSendMessage = (text) => {
    if (!text || !activeChat) return;
    sendMessage(activeChat.id, text, user?.name || "You", effectiveRole);
  };

  const handleApproveMatch = () => {
    if (!activeChat) return;
    markItemMatched(activeChat.itemId, activeChat.participantName);
  };

  const handleTriggerRequestMatch = () => {
    if (!activeChat) return;
    requestMarkAsMatched(activeChat.itemId, activeChat.participantName);
  };

  const handleConfirmReturned = () => {
    if (!activeChat) return;
    markItemReturned(activeChat.itemId, activeChat.participantName);
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
          <div className={isSlideContextOpen ? "pp-pane-context is-slide-open" : "pp-pane-context"}>
            <ItemContextPanel
              activeChat={activeChat}
              linkedItem={linkedItem}
              effectiveRole={effectiveRole}
              onRoleChange={(role) => setPerspectiveRole(role)}
              onApproveMatch={handleApproveMatch}
              onRequestMatch={handleTriggerRequestMatch}
              onConfirmReturned={handleConfirmReturned}
              onCloseMobile={() => setIsSlideContextOpen(false)}
            />
          </div>
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
