import React, { useState, useRef, useEffect } from "react";
import CategoryTile from "../common/CategoryTile";

export default function ItemContextPanel({
  activeChat,
  linkedItem,
  effectiveRole = "finder",
  onRoleChange,
  onApproveMatch,
  onRequestMatch,
  onConfirmReturned,
  onCloseMobile,
}) {
  const [photoParallax, setPhotoParallax] = useState({ x: 0, y: 0 });
  const [showFloater, setShowFloater] = useState(false);
  const photoRef = useRef(null);

  const currentItemStatus = linkedItem
    ? linkedItem.status
    : activeChat?.itemStatus || "Reported";

  const isMatched = currentItemStatus === "Matched" || linkedItem?.hasMatch;
  const isReturned = currentItemStatus === "Returned" || linkedItem?.isReturned;

  // Handle Return confirmation action with floating +50 chip animation
  const handleReturnClick = () => {
    onConfirmReturned?.();
    setShowFloater(true);
    setTimeout(() => setShowFloater(false), 2400);
  };

  const itemTitle = linkedItem?.description || activeChat?.itemTitle || "Reported Item";
  const itemCategory = linkedItem?.category || activeChat?.itemCategory || "General";
  const itemLocation = linkedItem?.locationFound || linkedItem?.locationLost || "Campus premises";
  const itemDate = linkedItem?.date || linkedItem?.reportingDate || linkedItem?.foundDate || "Recently";
  const itemImage = linkedItem?.image || null;

  // Masked vs revealed contact
  // Masked number: "+91 98••• •••••"
  // When matched: reveals unmasked or clear number
  const maskedContact = activeChat?.participantMaskedContact || "+91 98••• •••••";
  const revealedContact = activeChat?.participantMaskedContact
    ? activeChat.participantMaskedContact.replace(/•/g, "4")
    : "+91 98412 88712";

  // Stepper state
  const stepStage = isReturned ? 3 : isMatched ? 2 : 1;

  // Tiny photo parallax
  const handlePointerMove = (e) => {
    const el = photoRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    setPhotoParallax({ x, y });
  };

  const handlePointerLeave = () => {
    setPhotoParallax({ x: 0, y: 0 });
  };

  return (
    <aside className="pp-pane-context" aria-label="Item details and action panel">
      {/* Mobile close button */}
      {onCloseMobile && (
        <button
          type="button"
          className="pp-context-mobile-close"
          onClick={onCloseMobile}
          aria-label="Close details"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <div className="pp-context-scroll-body">
        {/* Large item photo (4/3 aspect, cover, subtle parallax) */}
        <div
          ref={photoRef}
          className="pp-context-photo-card"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {itemImage ? (
            <img
              src={itemImage}
              alt={itemTitle}
              className="pp-context-photo-img"
              style={{
                transform: `translate3d(${photoParallax.x.toFixed(1)}px, ${photoParallax.y.toFixed(1)}px, 0) scale(1.04)`,
              }}
            />
          ) : (
            <div className="pp-context-no-photo-tile">
              <CategoryTile category={itemCategory} size={84} radius={16} />
            </div>
          )}
        </div>

        {/* Title, Category & Location */}
        <div className="pp-context-header-block">
          <div className="pp-context-badge-row">
            <span className="pp-context-cat-pill">{itemCategory}</span>
            <span className="pp-context-type-pill">
              {activeChat?.itemType === "lost" ? "Lost report" : "Found report"}
            </span>
          </div>
          <h2 className="pp-context-item-title">{itemTitle}</h2>
          <div className="pp-context-meta-list">
            <div className="pp-context-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{itemLocation}</span>
            </div>
            <div className="pp-context-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{itemDate}</span>
            </div>
          </div>
        </div>

        <div className="pp-context-hairline" aria-hidden="true" />

        {/* Vertical 3-step status stepper */}
        <div className="pp-vertical-stepper" aria-label="Lifecycle progress">
          <div className="pp-vstep-line-bg" />
          <div
            className="pp-vstep-line-fill"
            style={{
              height: isReturned ? "100%" : isMatched ? "50%" : "0%",
            }}
          />

          {/* Step 1: Reported */}
          <div className="pp-vstep-row is-done">
            <div className="pp-vstep-dot is-done">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="pp-vstep-info">
              <span className="pp-vstep-title">Reported</span>
              <span className="pp-vstep-sub">Logged in campus board</span>
            </div>
          </div>

          {/* Step 2: Matched */}
          <div className={`pp-vstep-row ${stepStage >= 2 ? "is-done" : ""}`}>
            <div className={`pp-vstep-dot ${stepStage >= 2 ? "is-done" : ""}`}>
              {stepStage >= 2 ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="pp-vstep-num">2</span>
              )}
            </div>
            <div className="pp-vstep-info">
              <span className="pp-vstep-title">Matched</span>
              <span className="pp-vstep-sub">
                {isMatched ? "Description confirmed" : "Verification in chat"}
              </span>
            </div>
          </div>

          {/* Step 3: Returned */}
          <div className={`pp-vstep-row ${stepStage >= 3 ? "is-done" : ""}`}>
            <div className={`pp-vstep-dot ${stepStage >= 3 ? "is-done" : ""}`}>
              {stepStage >= 3 ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="pp-vstep-num">3</span>
              )}
            </div>
            <div className="pp-vstep-info">
              <span className="pp-vstep-title">Returned</span>
              <span className="pp-vstep-sub">
                {isReturned ? "Handover complete (+50 pts)" : "Awaiting handover"}
              </span>
            </div>
          </div>
        </div>

        {/* Floating +50 pts chip on return confirmation */}
        {showFloater && (
          <div className="pp-floater-pts-chip" aria-live="polite">
            +50 karma points!
          </div>
        )}

        <div className="pp-context-hairline" aria-hidden="true" />

        {/* Primary Action Button (Only ONE at a time) */}
        <div className="pp-context-action-wrap">
          {!isMatched && !isReturned ? (
            effectiveRole === "finder" ? (
              <button
                type="button"
                className="pp-btn-context-primary"
                onClick={onApproveMatch}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Mark as matched</span>
              </button>
            ) : (
              <button
                type="button"
                className="pp-btn-context-primary"
                onClick={onRequestMatch}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                <span>Request to match</span>
              </button>
            )
          ) : isMatched && !isReturned ? (
            effectiveRole === "owner" ? (
              <button
                type="button"
                className="pp-btn-context-primary is-return"
                onClick={handleReturnClick}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Mark as returned (+50 pts)</span>
              </button>
            ) : (
              <div className="pp-context-waiting-pill">
                <span className="pp-pulse-dot" aria-hidden="true" />
                <span>Waiting for owner to mark returned</span>
              </div>
            )
          ) : (
            <div className="pp-context-completed-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Returned &amp; Case Closed</span>
            </div>
          )}
        </div>

        {/* Contact Block: Masked vs Unmasked with Lock Animation */}
        <div className="pp-context-contact-card">
          <div className="pp-contact-card-top">
            <div className={`pp-lock-icon-wrap ${isMatched ? "is-unlocked" : "is-locked"}`}>
              {isMatched ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </div>
            <div className="pp-contact-card-label-col">
              <span className="pp-contact-card-title">Direct Contact</span>
              <span className="pp-contact-card-note">
                {isMatched
                  ? "Match confirmed — contact verified for handover."
                  : "Shared after the finder confirms a match."}
              </span>
            </div>
          </div>

          <div className="pp-contact-display-row">
            <span
              className={`pp-contact-number-val ${
                isMatched ? "is-revealed" : "is-masked"
              }`}
            >
              {isMatched ? revealedContact : maskedContact}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Demo View Segmented Control */}
      <footer className="pp-context-footer">
        <div className="pp-demo-view-wrap">
          <span className="pp-demo-view-label">Demo view</span>
          <div className="pp-demo-segmented-control" role="radiogroup" aria-label="Demo role switcher">
            <button
              type="button"
              role="radio"
              aria-checked={effectiveRole === "finder"}
              className={`pp-demo-seg-btn ${effectiveRole === "finder" ? "is-active" : ""}`}
              onClick={() => onRoleChange("finder")}
            >
              Finder
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={effectiveRole === "owner"}
              className={`pp-demo-seg-btn ${effectiveRole === "owner" ? "is-active" : ""}`}
              onClick={() => onRoleChange("owner")}
            >
              Owner
            </button>
          </div>
        </div>
      </footer>
    </aside>
  );
}
