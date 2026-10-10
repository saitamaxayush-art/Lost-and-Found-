import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function formatRelativeTime(timestamp) {
  if (!timestamp) return "Just now";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NotificationsPopover({
  notifications = [],
  isOpen = false,
  onClose,
  onClearAll,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("pointerdown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const latestNotifs = notifications.slice(0, 5);

  return (
    <div
      ref={popoverRef}
      className="pf-notif-popover"
      role="dialog"
      aria-label="Recent Notifications"
    >
      <div className="pf-notif-popover-header">
        <div className="pf-notif-title-row">
          <span className="pf-notif-popover-title">Notifications</span>
          {notifications.length > 0 && (
            <span className="pf-notif-count-pill">{notifications.length}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            className="pf-notif-clear-btn"
            onClick={onClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="pf-notif-list">
        {latestNotifs.length === 0 ? (
          <div className="pf-notif-empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <p>No new notifications</p>
            <span>Match alerts and return events will appear here.</span>
          </div>
        ) : (
          latestNotifs.map((n) => (
            <div key={n.id} className="pf-notif-row">
              <div className="pf-notif-dot" />
              <div className="pf-notif-content">
                <p className="pf-notif-msg">{n.message}</p>
                <div className="pf-notif-meta">
                  <span className="pf-notif-time">{formatRelativeTime(n.createdAt)}</span>
                  {n.chatId && (
                    <Link
                      to={`/people?chat=${n.chatId}`}
                      className="pf-notif-chat-link"
                      onClick={onClose}
                    >
                      Chat →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
