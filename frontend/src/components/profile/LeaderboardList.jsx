import React, { useEffect, useRef, useState } from "react";
import Avatar from "../common/Avatar";

export default function LeaderboardList({ entries = [], maxPoints = 500 }) {
  const currentUserRef = useRef(null);
  const [userRowOffScreen, setUserRowOffScreen] = useState(false);

  // Filter 4+ rank entries
  const listEntries = entries.slice(3);
  const currentUserEntry = entries.find((e) => e.isCurrentUser);

  useEffect(() => {
    if (!currentUserRef.current) {
      // If current user is not in list (maybe top 3 or not rendered)
      setUserRowOffScreen(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setUserRowOffScreen(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(currentUserRef.current);
    return () => observer.disconnect();
  }, [listEntries]);

  return (
    <div className="pf-leaderboard-list-wrap">
      <div className="pf-leaderboard-rows" role="list">
        {listEntries.map((entry) => {
          const isUser = Boolean(entry.isCurrentUser);
          const ratio = Math.min(100, Math.max(8, (entry.points / (maxPoints || 1)) * 100));

          return (
            <div
              key={entry.name + entry.rank}
              ref={isUser ? currentUserRef : null}
              className={`pf-lb-row ${isUser ? "is-current-user" : ""}`}
              role="listitem"
            >
              <div className="pf-lb-left">
                <span className="pf-lb-rank">#{entry.rank}</span>
                <Avatar name={entry.name} size={36} className="pf-lb-avatar" />
                <div className="pf-lb-name-group">
                  <div className="pf-lb-name-row">
                    <span className="pf-lb-name">{entry.name}</span>
                    {isUser && <span className="pf-you-tag">You</span>}
                  </div>
                  <span className="pf-lb-dept">{entry.department}</span>
                </div>
              </div>

              <div className="pf-lb-right">
                <div className="pf-lb-bar-track" aria-hidden="true">
                  <div
                    className="pf-lb-bar-fill"
                    style={{ width: `${ratio}%` }}
                  />
                </div>
                <span className="pf-lb-points">
                  <strong>{entry.points}</strong> pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pinned "Your position" bar sticking to bottom of viewport if user row is off-screen */}
      {userRowOffScreen && currentUserEntry && (
        <div className="pf-pinned-position-bar" role="status">
          <div className="pf-pinned-inner">
            <div className="pf-pinned-left">
              <span className="pf-pinned-badge">#{currentUserEntry.rank}</span>
              <Avatar name={currentUserEntry.name} size={28} />
              <span className="pf-pinned-title">Your position</span>
            </div>
            <div className="pf-pinned-right">
              <span className="pf-pinned-points">
                <strong>{currentUserEntry.points}</strong> pts
              </span>
              <button
                type="button"
                className="pf-pinned-scroll-btn"
                onClick={() => {
                  currentUserRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
              >
                Jump to row ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
