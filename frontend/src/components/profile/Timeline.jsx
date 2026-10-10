import React, { useEffect, useState } from "react";

export default function Timeline({ item }) {
  const [animate, setAnimate] = useState(false);

  const isLost = item.type === "lost";
  const isReturned = item.status === "Returned" || item.isReturned;
  const isMatched = item.status === "Matched" || item.hasMatch || (item.matchedUsers?.length > 0 && item.matchedUsers?.some(u => u.verified));

  // Determine stage progression:
  // Node 1 is always completed.
  // Node 2 is completed if isMatched (or isReturned).
  // Node 3 is completed if isReturned.
  const stage1Done = true;
  const stage2Done = Boolean(isMatched || isReturned);
  const stage3Done = Boolean(isReturned);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Compute fill line target percentage:
  // Stage 1 only: 0%
  // Stage 2: 50%
  // Stage 3: 100%
  const fillWidth = stage3Done ? "100%" : stage2Done ? "50%" : "0%";

  // Node 1 info
  const node1Title = isLost ? "Reported" : "Item Found";
  const node1Sub = item.date || item.reportingDate || item.foundDate || "Campus Registry";

  // Node 2 info
  const node2Title = isLost ? "Match Found" : "Match Verified";
  let node2Sub = "Searching reports";
  if (stage2Done) {
    if (isLost) {
      node2Sub = item.matchedProduct?.finderName
        ? `Found by ${item.matchedProduct.finderName}`
        : "Confirmed with finder";
    } else {
      const verifiedClaimant = item.matchedUsers?.find((u) => u.verified) || item.matchedUsers?.[0];
      node2Sub = verifiedClaimant ? `Matched with ${verifiedClaimant.name}` : "Claimant verified";
    }
  } else if (item.matchRequested) {
    node2Sub = "Match requested";
  }

  // Node 3 info
  const node3Title = "Returned";
  let node3Sub = "Pending match";
  if (stage3Done) {
    node3Sub = item.returnedDate
      ? `Confirmed · ${item.returnedDate}`
      : "Closed (+50 pts)";
  } else if (stage2Done) {
    node3Sub = isLost ? "Ready for handover" : "Awaiting owner confirm";
  }

  return (
    <div className="pf-timeline-container" aria-label="Item lifecycle timeline">
      <div className="pf-timeline-track-wrap">
        {/* Background track line */}
        <div className="pf-timeline-track-bg" />

        {/* Animated fill line */}
        <div
          className="pf-timeline-track-fill"
          style={{
            width: animate ? fillWidth : "0%",
            transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* Node 1 */}
        <div className="pf-timeline-node-item is-node-1">
          <div
            className={`pf-timeline-node-dot ${stage1Done ? "is-done" : ""}`}
            style={{ animationDelay: "100ms" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pf-check-icon"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="pf-timeline-caption">
            <span className="pf-timeline-stage">{node1Title}</span>
            <span className="pf-timeline-fact">{node1Sub}</span>
          </div>
        </div>

        {/* Node 2 */}
        <div className="pf-timeline-node-item is-node-2">
          <div
            className={`pf-timeline-node-dot ${
              stage2Done ? "is-done" : item.matchRequested ? "is-pending" : ""
            }`}
            style={{ animationDelay: "260ms" }}
          >
            {stage2Done ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pf-check-icon"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="pf-dot-number">2</span>
            )}
          </div>
          <div className="pf-timeline-caption">
            <span className="pf-timeline-stage">{node2Title}</span>
            <span className="pf-timeline-fact">{node2Sub}</span>
          </div>
        </div>

        {/* Node 3 */}
        <div className="pf-timeline-node-item is-node-3">
          <div
            className={`pf-timeline-node-dot ${stage3Done ? "is-done" : ""}`}
            style={{ animationDelay: "420ms" }}
          >
            {stage3Done ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pf-check-icon"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="pf-dot-number">3</span>
            )}
          </div>
          <div className="pf-timeline-caption">
            <span className="pf-timeline-stage">{node3Title}</span>
            <span className="pf-timeline-fact">{node3Sub}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
