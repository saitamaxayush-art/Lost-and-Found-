import React, { useState, useRef } from "react";
import CategoryTile from "../common/CategoryTile";
import Modal from "../landing/Modal";

export default function ItemContextPanel({
  activeChat,
  linkedItem,
  onMatchDecision,
  onReturnDecision,
  onCloseMobile,
  isSlideOpen = false,
}) {
  const [photoParallax, setPhotoParallax] = useState({ x: 0, y: 0 });
  const [showFloater, setShowFloater] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Explanation pop-up state
  const [explanationModal, setExplanationModal] = useState(null); // "not_matched" | "not_returned" | null
  const [explanationText, setExplanationText] = useState("");
  const [explanationError, setExplanationError] = useState("");
  const [submittingExplanation, setSubmittingExplanation] = useState(false);

  const photoRef = useRef(null);

  const status = (activeChat?.status || linkedItem?.status || "chatting").toLowerCase();
  const isMatched = status === "matched";
  const isReturned = status === "returned";

  const canDecideMatch = Boolean(activeChat?.canDecideMatch);
  const canDecideReturn = Boolean(activeChat?.canDecideReturn);

  const itemTitle = linkedItem?.description || activeChat?.itemTitle || "Reported Item";
  const itemCategory = linkedItem?.category || activeChat?.itemCategory || "General";
  const itemLocation = linkedItem?.locationFound || linkedItem?.locationLost || activeChat?.itemLocation || "Campus premises";
  const itemDate = linkedItem?.date || linkedItem?.reportingDate || linkedItem?.foundDate || activeChat?.itemDate || "Recently";
  const itemImage = linkedItem?.image || activeChat?.itemImage || null;

  const whatsapp = activeChat?.otherParty?.whatsapp;
  const hasWhatsapp = Boolean(whatsapp);
  const cleanDigits = whatsapp ? whatsapp.replace(/\D/g, "") : "";

  const handlePositiveDecision = async (decision) => {
    setActionLoading(true);
    setActionError("");
    try {
      if (decision === "matched") {
        await onMatchDecision?.("matched");
      } else if (decision === "returned") {
        await onReturnDecision?.("returned");
        setShowFloater(true);
        setTimeout(() => setShowFloater(false), 2400);
      }
    } catch (err) {
      setActionError(err.message || "Action failed. Please try again.");
      setTimeout(() => setActionError(""), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const openExplanationModal = (decision) => {
    setExplanationModal(decision);
    setExplanationText("");
    setExplanationError("");
  };

  const handleExplanationSubmit = async (e) => {
    e.preventDefault();
    if (explanationText.trim().length < 15) return;
    setSubmittingExplanation(true);
    setExplanationError("");

    try {
      if (explanationModal === "not_matched") {
        await onMatchDecision?.("not_matched", explanationText.trim());
      } else if (explanationModal === "not_returned") {
        await onReturnDecision?.("not_returned", explanationText.trim());
      }
      setExplanationModal(null);
    } catch (err) {
      setExplanationError(err.message || "Failed to submit explanation");
    } finally {
      setSubmittingExplanation(false);
    }
  };

  const handleCopyContact = (number) => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <aside className={`pp-pane-context ${isSlideOpen ? "is-slide-open" : ""}`} aria-label="Item details and action panel">
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

        {/* Primary Action Buttons (Driven strictly by server flags) */}
        <div className="pp-context-action-wrap">
          {actionError && (
            <div className="lf-otp-error" role="alert" style={{ marginBottom: "10px", width: "100%" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{actionError}</span>
            </div>
          )}
          {canDecideMatch ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                className="pp-btn-context-primary"
                disabled={actionLoading}
                onClick={() => handlePositiveDecision("matched")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Matched</span>
              </button>
              <button
                type="button"
                className="pp-btn-context-primary"
                style={{
                  background: "var(--paper-2)",
                  color: "var(--ink-soft)",
                  boxShadow: "none",
                  border: "1px solid var(--line)",
                }}
                disabled={actionLoading}
                onClick={() => openExplanationModal("not_matched")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Not matched</span>
              </button>
            </div>
          ) : canDecideReturn ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                className="pp-btn-context-primary is-return"
                disabled={actionLoading}
                onClick={() => handlePositiveDecision("returned")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Item returned (+50 pts)</span>
              </button>
              <button
                type="button"
                className="pp-btn-context-primary"
                style={{
                  background: "var(--paper-2)",
                  color: "var(--ink-soft)",
                  boxShadow: "none",
                  border: "1px solid var(--line)",
                }}
                disabled={actionLoading}
                onClick={() => openExplanationModal("not_returned")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Not returned</span>
              </button>
            </div>
          ) : status === "chatting" ? (
            <div className="pp-context-waiting-pill">
              <span className="pp-pulse-dot" aria-hidden="true" />
              <span>Waiting for the finder to confirm the match</span>
            </div>
          ) : status === "matched" ? (
            <div className="pp-context-waiting-pill">
              <span className="pp-pulse-dot" aria-hidden="true" />
              <span>Waiting for owner to confirm return</span>
            </div>
          ) : status === "returned" ? (
            <div className="pp-context-completed-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Returned &amp; Case Closed</span>
            </div>
          ) : (
            <div className="pp-context-waiting-pill">
              <span>Chat closed</span>
            </div>
          )}
        </div>

        {/* Contact Block: Masked vs Unmasked with Lock Animation */}
        <div className="pp-context-contact-card">
          <div className="pp-contact-card-top">
            <div className={`pp-lock-icon-wrap ${hasWhatsapp ? "is-unlocked" : "is-locked"}`}>
              {hasWhatsapp ? (
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
                {hasWhatsapp
                  ? "Match confirmed — contact verified for handover."
                  : "Shared after the finder confirms a match."}
              </span>
            </div>
          </div>

          <div className="pp-contact-display-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <span
              className={`pp-contact-number-val ${
                hasWhatsapp ? "is-revealed" : "is-masked"
              }`}
            >
              {hasWhatsapp ? whatsapp : "+91 ••••• •••••"}
            </span>
            {hasWhatsapp && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => handleCopyContact(whatsapp)}
                  title="Copy contact"
                  style={{
                    background: "none",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    color: "var(--ink-soft)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <a
                  href={`https://wa.me/${cleanDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "var(--success)",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explanation Modal for negative decisions */}
      {explanationModal && (
        <Modal onClose={() => setExplanationModal(null)} labelledBy="exp-modal-title" size="md">
          <h2 id="exp-modal-title" style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--espresso)" }}>
            {explanationModal === "not_matched" ? "Mark as not matched" : "Mark as not returned"}
          </h2>
          <p className="lm-sub" style={{ marginBottom: "16px", color: "var(--ink-soft)", fontSize: "14px" }}>
            Please explain what happened so both parties and campus moderators understand the reason.
          </p>

          <form onSubmit={handleExplanationSubmit}>
            <div className="lf-row">
              <label htmlFor="exp-textarea" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Please explain what happened</span>
                <span style={{ fontSize: "12px", color: explanationText.trim().length >= 15 ? "var(--success)" : "var(--ink-soft)" }}>
                  {explanationText.trim().length} / 15 min chars
                </span>
              </label>
              <textarea
                id="exp-textarea"
                rows={4}
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                placeholder="Please explain what happened (minimum 15 characters)..."
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  color: "var(--espresso)",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>

            {explanationError && (
              <p style={{ color: "var(--danger, #e53e3e)", fontSize: "13px", marginTop: "8px" }}>
                {explanationError}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="lf-ghost"
                onClick={() => setExplanationModal(null)}
                disabled={submittingExplanation}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="lf-submit"
                disabled={explanationText.trim().length < 15 || submittingExplanation}
              >
                {submittingExplanation ? "Submitting..." : "Submit explanation"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </aside>
  );
}
