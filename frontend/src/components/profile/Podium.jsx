import React from "react";
import Avatar from "../common/Avatar";

export default function Podium({ topThree = [] }) {
  if (!topThree || topThree.length < 3) return null;

  // 2-1-3 layout: index 1 (rank 2), index 0 (rank 1), index 2 (rank 3)
  const rank1 = topThree[0];
  const rank2 = topThree[1];
  const rank3 = topThree[2];

  const podiumOrder = [
    { entry: rank2, rankNum: 2, height: 110, delay: 180 },
    { entry: rank1, rankNum: 1, height: 148, delay: 80, isWinner: true },
    { entry: rank3, rankNum: 3, height: 86, delay: 280 },
  ];

  return (
    <div className="pf-podium-wrap" aria-label="Top 3 campus returners podium">
      <div className="pf-podium-cards-row">
        {podiumOrder.map(({ entry, rankNum, height, delay, isWinner }) => {
          if (!entry) return null;
          return (
            <div
              key={entry.name + rankNum}
              className={`pf-podium-col is-rank-col-${rankNum} ${isWinner ? "is-champion" : ""} ${entry.isCurrentUser ? "is-current-user" : ""}`}
              style={{ animationDelay: `${delay}ms` }}
            >
              {/* Crown for #1 */}
              {isWinner && (
                <div className="pf-podium-crown" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.202a4 4 0 0 1-3.856 2.929H8.709a4 4 0 0 1-3.856-2.93L2.019 6.02a.5.5 0 0 1 .798-.52l4.276 3.665a1 1 0 0 0 1.516-.294z" />
                  </svg>
                </div>
              )}

              {/* Avatar on top */}
              <div className="pf-podium-avatar-wrap">
                <Avatar
                  name={entry.name}
                  image={entry.avatarImage || null}
                  size={isWinner ? 54 : 44}
                  className="pf-podium-avatar"
                />
                <span className={`pf-podium-rank-tag is-rank-${rankNum}`}>
                  {rankNum}
                </span>
              </div>

              {/* Names & stats */}
              <div className="pf-podium-meta">
                <span className="pf-podium-name" title={entry.name}>
                  {entry.name}
                  {entry.isCurrentUser && <span className="pf-you-tag">You</span>}
                </span>
                <span className="pf-podium-dept">{entry.department}</span>
                <span className="pf-podium-pts">
                  <strong>{entry.points}</strong> pts
                </span>
              </div>

              {/* Column block rising up */}
              <div
                className="pf-podium-block"
                style={{
                  height,
                  animationDelay: `${delay + 60}ms`,
                }}
              >
                <span className="pf-podium-pillar-num">#{rankNum}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
