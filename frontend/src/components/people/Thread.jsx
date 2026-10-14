import React, { useRef, useEffect, useState } from "react";
import Avatar from "../common/Avatar";
import CategoryTile from "../common/CategoryTile";
import MessageGroup from "./MessageGroup";
import TypingDots from "./TypingDots";
import Composer from "./Composer";

export default function Thread({
  activeChat,
  linkedItem,
  userName = "You",
  effectiveRole = "finder",
  onSendMessage,
  onOpenContextPanel,
  onBackToList,
}) {
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const messages = activeChat?.messages || [];
  const participantName = activeChat?.participantName || "Student";
  const participantDept = activeChat?.participantDepartment || "Campus Network";
  const participantAvatar = activeChat?.participantAvatarImage || null;

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  // Group messages by continuous sender and system events
  // Structure: Array of { type: "system", ... } or { type: "group", sender, isOwn, messages: [...] }
  const messageBlocks = [];
  let currentGroup = null;

  messages.forEach((msg, idx) => {
    if (msg.senderRole === "system") {
      if (currentGroup) {
        messageBlocks.push(currentGroup);
        currentGroup = null;
      }
      messageBlocks.push({
        type: "system",
        id: msg.id || `sys-${idx}`,
        text: msg.text,
        time: msg.time,
      });
      return;
    }

    const isOwn = msg.sender === "You" || msg.sender === userName || msg.senderRole === effectiveRole;

    if (currentGroup && currentGroup.isOwn === isOwn && currentGroup.sender === msg.sender) {
      currentGroup.messages.push(msg);
    } else {
      if (currentGroup) {
        messageBlocks.push(currentGroup);
      }
      currentGroup = {
        type: "group",
        sender: msg.sender,
        isOwn,
        messages: [msg],
      };
    }
  });

  if (currentGroup) {
    messageBlocks.push(currentGroup);
  }

  // Determine whether to show quick suggestion chips:
  // "appears only when the thread is empty or the last message is from the other person"
  const lastMsg = messages[messages.length - 1];
  const lastIsOther =
    lastMsg &&
    lastMsg.senderRole !== "system" &&
    lastMsg.sender !== "You" &&
    lastMsg.sender !== userName;
  const showSuggestions = messages.length === 0 || Boolean(lastIsOther);

  const handleSend = (text) => {
    onSendMessage?.(text);

    // Auto-reply simulation: if sending a query to finder/owner, show brief typing indicator
    if (lastIsOther && Math.random() > 0.4) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 1400);
      }, 600);
    }
  };

  const itemPhoto = linkedItem?.image || null;
  const itemTitle = linkedItem?.description || activeChat?.itemTitle || "Item";

  return (
    <main className="pp-pane-thread" aria-label={`Conversation with ${participantName}`}>
      {/* Minimal Thread Header */}
      <header className="pp-thread-header">
        <div className="pp-thread-header-left">
          {/* Back button on mobile */}
          {onBackToList && (
            <button
              type="button"
              className="pp-mobile-back-btn"
              onClick={onBackToList}
              aria-label="Back to conversations"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}

          <Avatar
            name={participantName}
            image={participantAvatar}
            size={40}
            className="pp-thread-header-avatar"
          />

          <div className="pp-thread-user-meta">
            <h2 className="pp-thread-user-name">{participantName}</h2>
            <span className="pp-thread-user-sub">{participantDept}</span>
          </div>
        </div>

        {/* Item Chip that toggles / opens the context panel */}
        <div className="pp-thread-header-right">
          <button
            type="button"
            className="pp-item-header-chip"
            onClick={onOpenContextPanel}
            title="View item verification details"
          >
            <CategoryTile
              category={activeChat?.itemCategory}
              image={itemPhoto}
              size={24}
              radius={6}
            />
            <span className="pp-item-chip-title">{itemTitle}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="pp-thread-stream" role="log" aria-live="polite">
        {/* Day separator */}
        <div className="pp-day-separator">
          <span className="pp-day-pill">Today</span>
        </div>

        {messageBlocks.map((block, idx) => {
          if (block.type === "system") {
            return (
              <div key={block.id || idx} className="pp-system-pill-row">
                <div className="pp-system-event-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>{block.text}</span>
                </div>
              </div>
            );
          }

          return (
            <MessageGroup
              key={idx}
              group={block}
              isOwn={block.isOwn}
              participantName={participantName}
              participantAvatar={participantAvatar}
            />
          );
        })}

        {isTyping && <TypingDots />}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Thread Composer */}
      <Composer
        onSend={handleSend}
        status={activeChat?.status}
        participantName={participantName}
        showSuggestions={showSuggestions}
      />
    </main>
  );
}
