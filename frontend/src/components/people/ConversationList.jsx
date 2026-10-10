import React, { useState, useRef, useMemo } from "react";
import Avatar from "../common/Avatar";
import CategoryTile from "../common/CategoryTile";
import { useSlidingIndicator } from "../../hooks/useSlidingIndicator";

function formatChatTime(timestamp, fallback = "Active") {
  if (!timestamp) return fallback;
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 172800000) return "Yesterday";
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationList({
  conversations = [],
  activeChatId,
  onSelectChat,
  items = [],
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "lost" | "found" | "action"

  const filterBarRef = useRef(null);
  const filterIndicator = useSlidingIndicator(filterBarRef, filter, "[data-indicator-key]");

  // Pre-index items for fast item image / details lookup
  const itemsMap = useMemo(() => {
    const map = new Map();
    items.forEach((it) => map.set(it.id, it));
    return map;
  }, [items]);

  const filteredList = useMemo(() => {
    return conversations.filter((c) => {
      // Filter tab
      if (filter === "lost" && c.itemType !== "lost") return false;
      if (filter === "found" && c.itemType !== "found") return false;
      if (filter === "action") {
        const it = itemsMap.get(c.itemId);
        const status = it ? it.status : c.itemStatus;
        if (status === "Returned") return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch = c.participantName?.toLowerCase().includes(q);
        const titleMatch = c.itemTitle?.toLowerCase().includes(q);
        const deptMatch = c.participantDepartment?.toLowerCase().includes(q);
        const lastMsg = c.messages?.[c.messages.length - 1]?.text?.toLowerCase().includes(q);
        if (!nameMatch && !titleMatch && !deptMatch && !lastMsg) return false;
      }
      return true;
    });
  }, [conversations, filter, search, itemsMap]);

  return (
    <aside className="pp-pane-list" aria-label="Conversation list">
      {/* Top Search Input */}
      <div className="pp-list-search-wrap">
        <div className="pp-search-input-box">
          <svg
            className="pp-search-lens-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="pp-list-search-input"
            aria-label="Search conversations"
          />
          {search && (
            <button
              type="button"
              className="pp-search-clear-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Segmented Control Pills with sliding indicator */}
      <div className="pp-filter-segment-wrap" ref={filterBarRef} role="tablist">
        <div
          className="pp-filter-sliding-indicator"
          style={filterIndicator}
          aria-hidden="true"
        />

        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          data-indicator-key="all"
          className={`pp-filter-pill-btn ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "lost"}
          data-indicator-key="lost"
          className={`pp-filter-pill-btn ${filter === "lost" ? "is-active" : ""}`}
          onClick={() => setFilter("lost")}
        >
          Lost
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "found"}
          data-indicator-key="found"
          className={`pp-filter-pill-btn ${filter === "found" ? "is-active" : ""}`}
          onClick={() => setFilter("found")}
        >
          Found
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "action"}
          data-indicator-key="action"
          className={`pp-filter-pill-btn ${filter === "action" ? "is-active" : ""}`}
          onClick={() => setFilter("action")}
        >
          Needs action
        </button>
      </div>

      {/* Scrollable conversation items */}
      <div className="pp-list-items-stream" role="list">
        {filteredList.length === 0 ? (
          <div className="pp-list-empty">
            <p>No conversations found</p>
          </div>
        ) : (
          filteredList.map((c, idx) => {
            const isActive = c.id === activeChatId;
            const lastMsg = c.messages?.[c.messages.length - 1];
            const linked = itemsMap.get(c.itemId);
            const itemImage = linked?.image || null;
            const hasUnread = Boolean(c.unreadCount && c.unreadCount > 0);

            return (
              <div
                key={c.id}
                role="listitem"
                tabIndex={0}
                className={`pp-convo-row ${isActive ? "is-active" : ""} ${hasUnread ? "is-unread" : ""}`}
                style={{ animationDelay: `${idx * 40}ms` }}
                onClick={() => onSelectChat(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectChat(c.id);
                  }
                }}
              >
                {/* Active Indicator Bar */}
                <div className="pp-convo-active-bar" aria-hidden="true" />

                {/* Avatar with overlapping item thumbnail badge */}
                <div className="pp-convo-avatar-composite">
                  <Avatar
                    name={c.participantName}
                    image={c.participantAvatarImage || null}
                    size={44}
                    className="pp-convo-user-avatar"
                  />
                  <div className="pp-convo-item-badge">
                    <CategoryTile
                      category={c.itemCategory}
                      image={itemImage}
                      size={20}
                      radius={4}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="pp-convo-meta-area">
                  <div className="pp-convo-top-line">
                    <span className="pp-convo-name">
                      {c.participantName}
                      {hasUnread && <span className="pp-unread-dot" aria-hidden="true" />}
                    </span>
                    <span className="pp-convo-time">
                      {formatChatTime(lastMsg?.timestamp, lastMsg?.time)}
                    </span>
                  </div>

                  <span className="pp-convo-item-tag">
                    {c.itemType === "lost" ? "Lost" : "Found"} · {c.itemTitle}
                  </span>

                  <p className="pp-convo-last-msg">
                    {lastMsg ? lastMsg.text : "Start conversation..."}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
