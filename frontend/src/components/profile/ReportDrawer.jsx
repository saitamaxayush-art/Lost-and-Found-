import React from "react";
import { Link } from "react-router-dom";
import Timeline from "./Timeline";
import CategoryTile from "../common/CategoryTile";

export default function ReportDrawer({
  item,
  onInspectPhoto,
  onRequestMatch,
  onMarkMatched,
  onOwnerMarkReturned,
}) {
  const isLost = item.type === "lost";
  const isReturned = item.status === "Returned" || item.isReturned;
  const isMatched = item.status === "Matched" || item.hasMatch || (item.matchedUsers?.length > 0 && item.matchedUsers?.some((u) => u.verified));

  const chatId = `chat-${item.id}`;

  return (
    <div className="pf-drawer-content">
      {/* 1. Horizontal Timeline */}
      <Timeline item={item} />

      {/* 2. Two Columns Below: Left = Facts + Photo, Right = One Contextual Primary Action Card */}
      <div className="pf-drawer-bottom-grid">
        {/* Left Column: Photo & Definition list */}
        <div className="pf-drawer-left-col">
          <div className="pf-drawer-photo-wrap">
            {item.image ? (
              <div
                className="pf-drawer-photo-interactive"
                onClick={() => onInspectPhoto?.(item.id)}
                role="button"
                tabIndex={0}
                title="Click to view full photo"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onInspectPhoto?.(item.id);
                  }
                }}
              >
                <img
                  src={item.image}
                  alt={item.description}
                  className="pf-drawer-photo-img"
                />
                <span className="pf-photo-zoom-hint">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span>Enlarge</span>
                </span>
              </div>
            ) : (
              <div className="pf-drawer-no-photo">
                <CategoryTile category={item.category} size={72} radius={14} />
                <span className="pf-no-photo-txt">No photo attached</span>
              </div>
            )}
          </div>

          <dl className="pf-facts-dl">
            <div className="pf-fact-row">
              <dt>Location</dt>
              <dd>{item.locationLost || item.locationFound || "Campus premises"}</dd>
            </div>
            <div className="pf-fact-row">
              <dt>Date</dt>
              <dd>{item.date || item.reportingDate || item.foundDate || "Recently"}</dd>
            </div>
            <div className="pf-fact-row">
              <dt>Category</dt>
              <dd>{item.category || "General"}</dd>
            </div>
            {item.reportingState && (
              <div className="pf-fact-row">
                <dt>Registry</dt>
                <dd>{item.reportingState}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Right Column: ONE contextual primary action card */}
        <div className="pf-drawer-right-col">
          <div className="pf-action-card">
            {/* Contextual states */}
            {isReturned ? (
              <div className="pf-action-state-card is-returned-state">
                <div className="pf-state-header">
                  <div className="pf-status-icon-wrap is-success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="pf-action-state-title">Item Returned &amp; Closed</h3>
                    <p className="pf-action-state-desc">
                      Reunited with verified owner on {item.returnedDate || "Campus"}.
                    </p>
                  </div>
                </div>
                <div className="pf-points-earned-pill">
                  <span>+50 karma points awarded</span>
                </div>
              </div>
            ) : isLost ? (
              /* Lost item role (Current user is the owner) */
              isMatched ? (
                /* Owner can mark returned */
                <div className="pf-action-state-card">
                  <div className="pf-state-header">
                    <div className="pf-status-icon-wrap is-accent">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="pf-action-state-title">Match Confirmed</h3>
                      <p className="pf-action-state-desc">
                        {item.matchedProduct?.finderName
                          ? `Found by ${item.matchedProduct.finderName}. Verify item in person and close the case.`
                          : "Finder verified your description. Ready for handover."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pf-btn-action-primary"
                    onClick={(e) => onOwnerMarkReturned?.(e, item)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Mark as returned (+50 pts)</span>
                  </button>
                </div>
              ) : item.matchedProduct || item.hasMatch ? (
                item.matchRequested ? (
                  /* Waiting for finder state */
                  <div className="pf-action-state-card">
                    <div className="pf-state-header">
                      <span className="pf-pulse-ring" aria-hidden="true" />
                      <div>
                        <h3 className="pf-action-state-title">Waiting for Finder</h3>
                        <p className="pf-action-state-desc">
                          Match request sent to {item.matchedProduct?.finderName || "finder"}. Awaiting verification.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Request match button */
                  <div className="pf-action-state-card">
                    <div className="pf-state-header">
                      <div className="pf-status-icon-wrap is-accent">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="pf-action-state-title">Potential Match Available</h3>
                        <p className="pf-action-state-desc">
                          {item.matchedProduct?.title || "Matching found report"} reported by{" "}
                          {item.matchedProduct?.finderName || "Campus Finder"}.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pf-btn-action-primary"
                      onClick={(e) => onRequestMatch?.(e, item)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      <span>Request match</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="pf-action-state-card is-neutral">
                  <div className="pf-state-header">
                    <span className="pf-pulse-ring is-muted" aria-hidden="true" />
                    <div>
                      <h3 className="pf-action-state-title">Searching Registry</h3>
                      <p className="pf-action-state-desc">
                        Our campus matching engine checks new found reports in real-time.
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Found item role (Current user is the finder) */
              isMatched ? (
                /* Finder waiting for owner to return */
                <div className="pf-action-state-card">
                  <div className="pf-state-header">
                    <span className="pf-pulse-ring" aria-hidden="true" />
                    <div>
                      <h3 className="pf-action-state-title">Waiting for Owner</h3>
                      <p className="pf-action-state-desc">
                        Match verified. Once the claimant inspects and confirms handover, your +50 karma points will be credited.
                      </p>
                    </div>
                  </div>
                </div>
              ) : item.matchedUsers && item.matchedUsers.length > 0 ? (
                /* Finder can mark matched */
                <div className="pf-action-state-card">
                  <div className="pf-state-header">
                    <div className="pf-status-icon-wrap is-accent">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <polyline points="16 11 18 13 22 9" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="pf-action-state-title">Claimant Match Pending</h3>
                      <p className="pf-action-state-desc">
                        {item.matchedUsers[0]?.name || "Student"} submitted a claim. Verify description and approve match.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pf-btn-action-primary"
                    onClick={(e) => onMarkMatched?.(e, item)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Mark as matched</span>
                  </button>
                </div>
              ) : (
                <div className="pf-action-state-card is-neutral">
                  <div className="pf-state-header">
                    <span className="pf-pulse-ring is-muted" aria-hidden="true" />
                    <div>
                      <h3 className="pf-action-state-title">Safe in Custody</h3>
                      <p className="pf-action-state-desc">
                        Reported found. You will receive an alert as soon as a student claims it.
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Secondary Link: "Open chat" */}
            <div className="pf-action-secondary-row">
              <Link
                to={`/people?chat=${chatId}`}
                className="pf-open-chat-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Open chat</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
