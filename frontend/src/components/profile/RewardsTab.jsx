import React, { useState } from "react";
import Podium from "./Podium";
import LeaderboardList from "./LeaderboardList";
import { useCountUp } from "../../hooks/useCountUp";

export default function RewardsTab({
  userPoints = 0,
  pointsLedger = [],
  fullLeaderboard = [],
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const animatedPoints = useCountUp(userPoints, 650);

  // Tier logic
  const nextTierName =
    userPoints < 150 ? "Gold Helper" : userPoints < 300 ? "Campus Guardian" : "Maximum Tier";
  const nextTierThreshold = userPoints < 150 ? 150 : userPoints < 300 ? 300 : 500;
  const currentTierBase = userPoints < 150 ? 0 : userPoints < 300 ? 150 : 300;
  const progressRatio = Math.min(
    100,
    Math.max(
      4,
      ((userPoints - currentTierBase) / (nextTierThreshold - currentTierBase)) * 100
    )
  );

  // Compute 6 period bars from ledger
  // If ledger is small, build 6 slots (e.g., P1 to P6)
  const barSlots = [
    { label: "W1", points: 0 },
    { label: "W2", points: 0 },
    { label: "W3", points: 0 },
    { label: "W4", points: 0 },
    { label: "W5", points: 0 },
    { label: "W6", points: 0 },
  ];

  if (pointsLedger.length > 0) {
    const rev = [...pointsLedger].reverse();
    rev.slice(0, 6).forEach((tx, idx) => {
      barSlots[idx].points = Number(tx.points) || 50;
      if (tx.date) {
        const d = new Date(tx.date);
        barSlots[idx].label = isNaN(d.getTime())
          ? `P${idx + 1}`
          : d.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    });
  }

  const maxBarValue = Math.max(...barSlots.map((b) => b.points), 50);

  // Leaderboard data
  const topThree = fullLeaderboard.slice(0, 3);
  const maxLeaderboardPoints = fullLeaderboard[0]?.points || 500;

  return (
    <div className="pf-rewards-tab-content">
      {/* Top Banner Grid */}
      <section className="pf-rewards-hero-grid">
        {/* Left: Large points, tier progress bar, info tooltip */}
        <div className="pf-rewards-summary-card">
          <div className="pf-rewards-score-row">
            <span className="pf-rewards-score-num">{animatedPoints}</span>
            <div className="pf-rewards-score-meta">
              <span className="pf-rewards-score-lbl">Total Karma Points</span>
              <div className="pf-tooltip-wrapper">
                <button
                  type="button"
                  className="pf-info-btn"
                  onClick={() => setTooltipOpen((v) => !v)}
                  aria-label="Points explanation"
                  aria-expanded={tooltipOpen}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
                {tooltipOpen && (
                  <div className="pf-info-tooltip" role="tooltip">
                    <span>50 points earned per confirmed returned item.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pf-tier-progress-section">
            <div className="pf-tier-progress-labels">
              <span>Next tier: {nextTierName}</span>
              <span>{userPoints} / {nextTierThreshold} pts</span>
            </div>
            <div className="pf-tier-track" aria-hidden="true">
              <div
                className="pf-tier-fill"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Compact SVG Bar Chart for last 6 periods */}
        <div className="pf-rewards-chart-card">
          <div className="pf-chart-header">
            <span className="pf-chart-title">Recent Earnings</span>
            <span className="pf-chart-sub">Last 6 activity records</span>
          </div>

          <div className="pf-bar-chart-wrap" aria-label="Points earned bar chart">
            <div className="pf-bars-container">
              {barSlots.map((slot, i) => {
                const heightPct = Math.min(
                  100,
                  Math.max(6, (slot.points / maxBarValue) * 100)
                );
                return (
                  <div key={i} className="pf-bar-slot">
                    <div className="pf-bar-pillar-wrap">
                      <div
                        className="pf-bar-pillar"
                        style={{
                          height: `${heightPct}%`,
                          animationDelay: `${i * 65 + 100}ms`,
                        }}
                        title={`${slot.points} pts`}
                      />
                    </div>
                    <span className="pf-bar-slot-label">{slot.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Activity List: Replaces the points table */}
      <section className="pf-activity-list-section">
        <h2 className="pf-section-heading">Points Activity</h2>

        {pointsLedger.length === 0 ? (
          <p className="pf-activity-empty-line">
            No point transactions recorded yet. Returning reported items will credit points here.
          </p>
        ) : (
          <div className="pf-activity-rows" role="list">
            {pointsLedger.map((tx) => (
              <div key={tx.id} className="pf-activity-row" role="listitem">
                <div className="pf-activity-left">
                  <div className="pf-activity-icon-circle" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="pf-activity-title">{tx.itemTitle}</h3>
                    <p className="pf-activity-sub">
                      {tx.role || "Finder"} · To: {tx.recipient || "Verified Owner"} · {tx.date}
                    </p>
                  </div>
                </div>

                <div className="pf-activity-right">
                  <span className="pf-activity-pts-chip">+{tx.points}</span>
                  <span className="pf-activity-status-txt">Returned</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard Section */}
      <section className="pf-leaderboard-section">
        <div className="pf-leaderboard-head">
          <h2 className="pf-section-heading">Campus Leaderboard</h2>
          <span className="pf-leaderboard-sub">
            Top student helpers ranked by return karma
          </span>
        </div>

        {/* Podium for top 3 */}
        <Podium topThree={topThree} />

        {/* List for 4+ ranks */}
        <LeaderboardList
          entries={fullLeaderboard}
          maxPoints={maxLeaderboardPoints}
        />
      </section>
    </div>
  );
}
