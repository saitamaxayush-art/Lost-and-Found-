import React, { useEffect, useRef, useState } from "react";
import Avatar from "../common/Avatar";

export default function LeaderboardList({ entries = [], maxPoints = 500 }) {
  const currentUserRef = useRef(null);

  // Filter 4+ rank entries
  const listEntries = entries.slice(3);

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
    </div>
  );
}
