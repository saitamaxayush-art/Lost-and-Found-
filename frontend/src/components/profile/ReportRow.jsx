import React, { useRef } from "react";
import CategoryTile from "../common/CategoryTile";
import ReportDrawer from "./ReportDrawer";
import { useSpotlight } from "../../hooks/useSpotlight";

export default function ReportRow({
  item,
  isExpanded = false,
  isHighlighted = false,
  onToggleExpand,
  onInspectPhoto,
  onRequestMatch,
  onMarkMatched,
  onOwnerMarkReturned,
}) {
  const rowRef = useSpotlight();

  const isLost = item.type === "lost";
  const isReturned = item.status === "Returned" || item.isReturned;
  const isMatched = item.status === "Matched" || item.hasMatch || (item.matchedUsers?.length > 0 && item.matchedUsers?.some(u => u.verified));

  // Stage 1 (Reported), Stage 2 (Matched), Stage 3 (Returned)
  const stepStage = isReturned ? 3 : isMatched ? 2 : 1;

  // Status label
  const statusLabel = isReturned ? "Returned" : isMatched ? "Matched" : "Reported";
  const statusTheme = isReturned ? "is-returned" : isMatched ? "is-matched" : "is-reported";

  // Meta line text: e.g. "Lost · Electronics · Central Library"
  const metaParts = [
    isLost ? "Lost" : "Found",
    item.category || "General",
    item.date || item.reportingDate || item.foundDate || "Recent",
    item.locationLost || item.locationFound || null,
  ].filter(Boolean);

  return (
    <article
      id={`pf-item-${item.id}`}
      ref={rowRef}
      className={`pf-report-row-card ${isExpanded ? "is-expanded" : ""} ${
        isHighlighted ? "is-highlighted" : ""
      }`}
    >
      {/* Interactive summary row */}
      <div
        className="pf-report-summary-bar"
        onClick={() => onToggleExpand(item.id)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`pf-drawer-${item.id}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand(item.id);
          }
        }}
      >
        {/* Left: 64px photo thumbnail or category tile */}
        <div className="pf-row-thumb-area">
          <CategoryTile
            category={item.category}
            image={item.image}
            size={56}
            radius={12}
            alt={item.description}
          />
        </div>

        {/* Center: Title + Quiet meta line */}
        <div className="pf-row-main-content">
          <h2 className="pf-row-title" title={item.description}>
            {item.description}
          </h2>
          <div className="pf-row-meta">
            {metaParts.map((part, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="pf-meta-sep">·</span>}
                <span>{part}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right: Mini 3-step progress + Status label + Chevron */}
        <div className="pf-row-right-area">
          <div className="pf-mini-stepper" aria-hidden="true">
            <div className={`pf-mini-dot ${stepStage >= 1 ? "is-filled" : ""}`} />
            <div className={`pf-mini-line ${stepStage >= 2 ? "is-filled" : ""}`} />
            <div className={`pf-mini-dot ${stepStage >= 2 ? "is-filled" : ""}`} />
            <div className={`pf-mini-line ${stepStage >= 3 ? "is-filled" : ""}`} />
            <div className={`pf-mini-dot ${stepStage >= 3 ? "is-filled" : ""}`} />
          </div>

          <span className={`pf-status-badge ${statusTheme}`}>
            {statusLabel}
          </span>

          <span className="pf-chevron-btn" aria-hidden="true">
            <svg
              className={`pf-row-chevron ${isExpanded ? "is-flipped" : ""}`}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>

      {/* Expand inline with grid-template-rows: 0fr -> 1fr */}
      <div
        id={`pf-drawer-${item.id}`}
        className={`pf-drawer-expandable ${isExpanded ? "is-open" : ""}`}
      >
        <div className="pf-drawer-inner">
          {isExpanded && (
            <ReportDrawer
              item={item}
              onInspectPhoto={onInspectPhoto}
              onRequestMatch={onRequestMatch}
              onMarkMatched={onMarkMatched}
              onOwnerMarkReturned={onOwnerMarkReturned}
            />
          )}
        </div>
      </div>
    </article>
  );
}
