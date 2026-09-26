import React from "react";

/**
 * SearchDissolveLoader
 *
 * A smooth, clear, on-theme loading animation for the campus search.
 * Matches the warm peach, ivory, and terracotta palette of the site (--peach-1, --peach-2, --peach-accent).
 * Features a gentle radar beacon, silky gradient-sweep typography, and warm card skeleton previews.
 */
export default function SearchDissolveLoader({
  label = "Searching campus records…",
  caption = "Scanning descriptions, locations, and recently reported items",
}) {
  return (
    <div className="sr-loader-container" role="status" aria-live="polite">
      <div className="sr-loader-card">
        {/* Pulsing beacon with expanding concentric ripples in warm terracotta/amber */}
        <div className="sr-beacon-wrap" aria-hidden="true">
          <div className="sr-beacon-ring sr-ring-1" />
          <div className="sr-beacon-ring sr-ring-2" />
          <div className="sr-beacon-core">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Clear, smooth title with silky light-sweep animation */}
        <h3 className="sr-loader-title">{label}</h3>

        {/* Subtitle describing the action */}
        <p className="sr-loader-desc">{caption}</p>

        {/* Smooth warm loading pill indicator with 3 gentle pulsing dots */}
        <div className="sr-loader-pill" aria-hidden="true">
          <span className="sr-dot sr-dot-1" />
          <span className="sr-dot sr-dot-2" />
          <span className="sr-dot sr-dot-3" />
        </div>
      </div>

      {/* Shimmering preview skeleton cards that match the real item grid */}
      <div className="sr-skeleton-grid" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <div key={n} className="sr-skeleton-card">
            <div className="sr-skeleton-media sr-shimmer" />
            <div className="sr-skeleton-body">
              <div className="sr-skeleton-tags">
                <span className="sr-skel-pill sr-shimmer" />
                <span className="sr-skel-pill sr-skel-pill-sm sr-shimmer" />
              </div>
              <div className="sr-skel-line sr-skel-title sr-shimmer" />
              <div className="sr-skel-line sr-skel-sub sr-shimmer" />
              <div className="sr-skeleton-footer">
                <span className="sr-skel-pill-xs sr-shimmer" />
                <span className="sr-skel-pill-xs sr-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <span className="sr-sr">Searching reported items, please wait</span>
    </div>
  );
}
