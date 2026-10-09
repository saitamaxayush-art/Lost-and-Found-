import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Nav from "../components/landing/Nav";
import ReportModal from "../components/landing/ReportModal";
import ItemModal from "../components/landing/ItemModal";
import LoginModal from "../components/landing/LoginModal";
import { FAKE_LEADERBOARD } from "../data/profileData";
import "../styles/landing.css";
import "../styles/sections.css";
import "../styles/profile.css";

export default function Profile() {
  const {
    user,
    items,
    userPoints,
    pointsLedger,
    returnItem,
    confirmLostItemReturned,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("activity"); // "activity" | "leaderboard"
  const [filterType, setFilterType] = useState("all"); // "all" | "lost" | "found"
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null); // Clicked item to show progress line
  const [highlightedId, setHighlightedId] = useState(() => location.state?.highlightItemId || null);

  const [reportModalType, setReportModalType] = useState(null);
  const [inspectItemId, setInspectItemId] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    document.title = "My Profile — FindBack";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Handle redirect from report flow with highlight
  useEffect(() => {
    const targetId = location.state?.highlightItemId;
    if (targetId) {
      setHighlightedId(targetId);
      setActiveTab("activity");
      setFilterType("all");
      setSearchQuery("");
      setExpandedId(targetId);

      const timer = setTimeout(() => {
        const el = document.getElementById(`pf-item-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);

      const clearTimer = setTimeout(() => {
        setHighlightedId((prev) => (prev === targetId ? null : prev));
      }, 7000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [location.state]);

  // Filter items belonging to the current user
  const userItems = useMemo(() => {
    if (!user) return [];

    const userEmail = (user.email || "").toLowerCase().trim();
    const userPhone = (user.whatsapp || "").replace(/[\s()-]/g, "");
    const userName = (user.name || "").toLowerCase().trim();

    return items.filter((item) => {
      if (item.isUserItem) return true;
      const rep = (item.reporter || "").toLowerCase();
      if (userEmail && rep === userEmail) return true;
      if (userPhone && rep.includes(userPhone)) return true;
      if (userName && (item.reporterName || "").toLowerCase().includes(userName)) return true;
      return false;
    });
  }, [items, user]);

  const displayedItems = useMemo(() => {
    return userItems.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [userItems, filterType, searchQuery]);

  const lostCount = useMemo(() => userItems.filter((i) => i.type === "lost").length, [userItems]);
  const foundCount = useMemo(() => userItems.filter((i) => i.type === "found").length, [userItems]);
  const returnedCount = useMemo(
    () => userItems.filter((i) => i.status === "Returned" || i.isReturned).length,
    [userItems]
  );

  // Dynamic Leaderboard: Insert current user with real points and rank
  const fullLeaderboard = useMemo(() => {
    const currentUserEntry = {
      rank: 0,
      name: user?.name || "You",
      department: user?.campus || "Your Department",
      itemsReturned: returnedCount,
      points: userPoints,
      isCurrentUser: true,
      badge: userPoints >= 300 ? "Campus Guardian" : userPoints >= 150 ? "Gold Helper" : "Active Member",
    };

    const combined = [...FAKE_LEADERBOARD, currentUserEntry];
    combined.sort((a, b) => b.points - a.points);

    return combined.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [user, userPoints, returnedCount]);

  const userRank = useMemo(() => {
    const entry = fullLeaderboard.find((e) => e.isCurrentUser);
    return entry ? entry.rank : 6;
  }, [fullLeaderboard]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkReturned = (e, item) => {
    e.stopPropagation();
    const recipient = item.matchedUsers?.[0]?.name || "Verified Owner";
    returnItem(item.id, recipient, { silent: true });
  };

  const handleConfirmLostReturned = (e, item) => {
    e.stopPropagation();
    confirmLostItemReturned(item.id, { silent: true });
  };

  if (!user) {
    return (
      <div className="pf-page">
        <Nav goTo={(id) => navigate("/", { state: { scrollTo: id } })} onLogin={() => setLoginModalOpen(true)} />
        <div className="pf-container">
          <div className="pf-gate-card">
            <h1 className="pf-gate-title">Login Required</h1>
            <p className="pf-gate-text">
              Please sign in to view your profile, report history, and karma points.
            </p>
            <button
              type="button"
              className="pf-btn-primary"
              onClick={() => {
                setLoginModalOpen(true);
              }}
            >
              Sign In
            </button>
            <div style={{ marginTop: 16 }}>
              <Link to="/" className="pf-back-btn">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} onSuccess={() => setLoginModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="pf-page">
      <Nav goTo={(id) => navigate("/", { state: { scrollTo: id } })} onLogin={() => setLoginModalOpen(false)} />

      <main className="pf-container">
        {/* Top Breadcrumb */}
        <div className="pf-breadcrumb">
          <Link to="/" className="pf-back-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Board</span>
          </Link>
          <span className="pf-campus-badge">
            {user.campus || "Campus Portal"}
          </span>
        </div>

        {/* Clean Profile Header */}
        <div className="pf-hero-clean">
          <div className="pf-hero-left">
            <div className="pf-avatar-circle">
              {user.name?.trim()?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="pf-hero-details">
              <div className="pf-hero-name-row">
                <h1 className="pf-hero-name">{user.name}</h1>
              </div>
              <div className="pf-hero-contact-row">
                <span>{user.email || "student@campus.edu"}</span>
                {user.whatsapp && <span>• {user.whatsapp}</span>}
                <span>• {user.campus || "Campus"}</span>
              </div>
            </div>
          </div>

          <div className="pf-hero-right">
            <div className="pf-quick-stats">
              <div className="pf-stat-box">
                <span className="pf-stat-num">{userPoints}</span>
                <span className="pf-stat-lbl">Points</span>
              </div>
              <div className="pf-stat-box">
                <span className="pf-stat-num">#{userRank}</span>
                <span className="pf-stat-lbl">Rank</span>
              </div>
              <div className="pf-stat-box">
                <span className="pf-stat-num">{userItems.length}</span>
                <span className="pf-stat-lbl">Reports</span>
              </div>
            </div>

            <div className="pf-hero-actions-clean">
              <button
                type="button"
                className="pf-btn-primary"
                onClick={() => {
                  setReportModalType("lost");
                }}
              >
                + Report Lost
              </button>
              <button
                type="button"
                className="pf-btn-secondary"
                onClick={() => {
                  setReportModalType("found");
                }}
              >
                + Report Found
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="pf-main-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "activity"}
            className={`pf-tab-btn ${activeTab === "activity" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("activity");
            }}
          >
            My Reports ({userItems.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "leaderboard"}
            className={`pf-tab-btn ${activeTab === "leaderboard" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("leaderboard");
            }}
          >
            Points &amp; Leaderboard
          </button>
        </div>

        {/* ================= TAB 1: REPORTS (MINIMIZED ITEMS WITH ON-CLICK ANIMATION) ================= */}
        {activeTab === "activity" && (
          <div>
            <div className="pf-filter-bar">
              <div className="pf-seg-filter">
                <button
                  type="button"
                  className={`pf-seg-btn ${filterType === "all" ? "is-active" : ""}`}
                  onClick={() => {
                    setFilterType("all");
                  }}
                >
                  All ({userItems.length})
                </button>
                <button
                  type="button"
                  className={`pf-seg-btn ${filterType === "lost" ? "is-active" : ""}`}
                  onClick={() => {
                    setFilterType("lost");
                  }}
                >
                  Lost ({lostCount})
                </button>
                <button
                  type="button"
                  className={`pf-seg-btn ${filterType === "found" ? "is-active" : ""}`}
                  onClick={() => {
                    setFilterType("found");
                  }}
                >
                  Found ({foundCount})
                </button>
              </div>

              <div className="pf-search-wrap">
                <svg className="pf-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="pf-search-input"
                  placeholder="Filter items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {displayedItems.length === 0 ? (
              <div className="pf-empty-state">
                <h3 className="pf-empty-title">No reports found</h3>
                <p className="pf-empty-desc">You do not have any items under this filter.</p>
                <button
                  type="button"
                  className="pf-btn-primary"
                  onClick={() => {
                    setReportModalType("lost");
                  }}
                >
                  Report an Item
                </button>
              </div>
            ) : (
              <div className="pf-items-list">
                {displayedItems.map((item) => {
                  const isLost = item.type === "lost";
                  const isReturned = item.status === "Returned" || item.isReturned;
                  const isMatched = item.status === "Matched" || item.hasMatch || (item.matchedUsers?.length > 0);
                  const isExpanded = expandedId === item.id;
                  const isHighlighted = highlightedId === item.id;

                  // Progress percentage for increasing line animation
                  // Stage 1 only = 0%, Stage 2 (Matched) = 50%, Stage 3 (Returned) = 100%
                  const targetWidth = isReturned ? "100%" : isMatched ? "50%" : "0%";

                  return (
                    <article
                      id={`pf-item-${item.id}`}
                      className={`pf-item-clean-card ${isExpanded ? "is-expanded" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
                      key={item.id}
                    >
                      {/* 1. MINIMIZED ITEM ROW (Click to reveal stage progress line) */}
                      <div
                        className="pf-item-main-row"
                        onClick={() => toggleExpand(item.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleExpand(item.id);
                          }
                        }}
                      >
                        <div className="pf-item-info-col">
                          <div className="pf-item-meta-clean">
                            <span className="pf-meta-type-text">{isLost ? "Lost Item" : "Found Item"}</span>
                            <span className="pf-meta-sep">•</span>
                            <span>{item.category}</span>
                            <span className="pf-meta-sep">•</span>
                            <span>{item.date || item.reportingDate}</span>
                            {isHighlighted && (
                              <span className="pf-just-reported-badge">Newly Reported</span>
                            )}
                          </div>
                          <h2 className="pf-item-title">{item.description}</h2>
                          {(item.locationLost || item.locationFound) && (
                            <span className="pf-item-location-sub">
                              {item.locationLost || item.locationFound}
                            </span>
                          )}
                        </div>

                        <div className="pf-item-right-col">
                          <span className="pf-expand-indicator">
                            <span>{isExpanded ? "Hide Status" : "View Status"}</span>
                            <svg
                              className="pf-chevron"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </div>
                      </div>

                      {/* 2. ANIMATED EXPANDABLE DRAWER WITH PROGRESSIVELY INCREASING PROGRESS BAR */}
                      {isExpanded && (
                        <div className="pf-stage-drawer">
                          {/* Animated Progress Line */}
                          <div className="pf-progress-stepper-wrap">
                            <div className="pf-stepper-track-wrap">
                              <div
                                className="pf-stepper-progress-fill"
                                style={{ "--target-width": targetWidth }}
                              />

                              <div className="pf-stepper-nodes-row">
                                {/* Node 1 */}
                                <div className="pf-stepper-node-circle is-done">
                                  1
                                </div>
                                {/* Node 2 */}
                                <div
                                  className={`pf-stepper-node-circle ${
                                    isMatched ? (isReturned ? "is-done" : "is-active") : ""
                                  }`}
                                >
                                  2
                                </div>
                                {/* Node 3 */}
                                <div
                                  className={`pf-stepper-node-circle ${isReturned ? "is-done" : ""}`}
                                >
                                  3
                                </div>
                              </div>
                            </div>

                            <div className="pf-stepper-labels-row">
                              <div className="pf-node-label-col">
                                <span className="pf-node-step-tag">Stage 1</span>
                                <span className="pf-node-step-name">
                                  {isLost ? "Reported" : "Item Found"}
                                </span>
                              </div>
                              <div className="pf-node-label-col">
                                <span className="pf-node-step-tag">Stage 2</span>
                                <span className="pf-node-step-name">
                                  {isLost ? "Match Found" : "User Matches"}
                                </span>
                              </div>
                              <div className="pf-node-label-col">
                                <span className="pf-node-step-tag">Stage 3</span>
                                <span className="pf-node-step-name">
                                  {isLost ? "Item Returned" : "Returned to Owner"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Concise, simple 3-stage details (minimal text) */}
                          <div className="pf-stages-detail-grid">
                            {isLost ? (
                              /* LOST ITEM: 3 SIMPLE STAGES */
                              <>
                                <div className="pf-detail-col">
                                  <span className="pf-detail-col-title">1. Date &amp; State</span>
                                  <div className="pf-detail-col-val">
                                    Reported on {item.reportingDate || item.date}
                                  </div>
                                </div>

                                <div className="pf-detail-col">
                                  <span className="pf-detail-col-title">2. Found a Match?</span>
                                  {item.matchedProduct || item.hasMatch ? (
                                    <div className="pf-match-plain-card">
                                      <div className="pf-match-plain-title">{item.matchedProduct?.title || "Matching found item"}</div>
                                      <div className="pf-match-plain-sub">Found at: {item.matchedProduct?.locationFound || "Campus"}</div>
                                    </div>
                                  ) : (
                                    <div className="pf-detail-col-val" style={{ color: "var(--peach-ink-soft)" }}>
                                      Searching active reports...
                                    </div>
                                  )}
                                </div>

                                <div className="pf-detail-col">
                                  <span className="pf-detail-col-title">3. Item Returned?</span>
                                  {isReturned ? (
                                    <div className="pf-detail-col-val" style={{ fontWeight: 600 }}>
                                      Returned on {item.returnedDate || "Confirmed"} (+50 pts)
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="pf-detail-col-val" style={{ color: "var(--peach-ink-soft)" }}>
                                        Pending return
                                      </div>
                                      {item.matchedProduct && (
                                        <button
                                          type="button"
                                          className="pf-return-btn-action"
                                          onClick={(e) => handleConfirmLostReturned(e, item)}
                                        >
                                          Confirm Received (+50 pts)
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              /* FOUND ITEM: 3 SIMPLE STAGES */
                              <>
                                <div className="pf-detail-col">
                                  <span className="pf-detail-col-title">1. When Found</span>
                                  <div className="pf-detail-col-val">
                                    Found on {item.foundDate || item.date} at {item.locationFound || "Campus"}
                                  </div>
                                </div>

                                <div className="pf-detail-col">
                                  <span className="pf-detail-col-title">2. Matched Users</span>
                                  {item.matchedUsers && item.matchedUsers.length > 0 ? (
                                    <div className="pf-claimants-list-clean">
                                      {item.matchedUsers.map((u) => (
                                        <div className="pf-claimant-row-clean" key={u.id || u.name}>
                                          <strong>{u.name}</strong> ({u.department}) • {u.maskedContact}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="pf-detail-col-val" style={{ color: "var(--peach-ink-soft)" }}>
                                      No matches yet
                                    </div>
                                  )}
                                </div>

                                <div className="pf-detail-col">
                                  <span className="pf-detail-col-title">3. Returned to Owner?</span>
                                  {isReturned ? (
                                    <div className="pf-detail-col-val" style={{ fontWeight: 600 }}>
                                      Returned to {item.returnedTo || "Owner"} (+50 pts)
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="pf-detail-col-val" style={{ color: "var(--peach-ink-soft)" }}>
                                        Pending handover
                                      </div>
                                      <button
                                        type="button"
                                        className="pf-return-btn-action"
                                        onClick={(e) => handleMarkReturned(e, item)}
                                      >
                                        Mark as Returned (+50 pts)
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* User Provided Image Section in View Status */}
                          <div className="pf-drawer-image-section">
                            <div className="pf-drawer-image-head">
                              <span className="pf-detail-col-title">Item Photo</span>
                              <span className="pf-drawer-image-state-text">
                                {item.image ? "Photo provided by user" : "No photo provided by user"}
                              </span>
                            </div>
                            {item.image ? (
                              <div className="pf-drawer-image-card">
                                <img
                                  src={item.image}
                                  alt={item.description}
                                  className="pf-drawer-image-thumb"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectItemId(item.id);
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  title="Click to view full photo"
                                />
                                <div className="pf-drawer-image-details">
                                  <span className="pf-drawer-image-caption">
                                    Photograph attached to report for verification.
                                  </span>
                                  <button
                                    type="button"
                                    className="pf-drawer-image-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInspectItemId(item.id);
                                    }}
                                  >
                                    View Full Photo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pf-drawer-no-image-box">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span>No photo was provided by the user for this item</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: POINTS & LEADERBOARD ================= */}
        {activeTab === "leaderboard" && (
          <div>
            {/* Rule Banner */}
            <div className="pf-rule-banner-clean">
              <div className="pf-rule-text">
                <strong>Karma Points Rule:</strong> Earn <strong>50 points</strong> whenever an item you reported is returned to its rightful owner.
              </div>
              <div className="pf-user-total-badge">
                {userPoints} Points Total
              </div>
            </div>

            {/* Points Table */}
            <div className="pf-clean-table-box">
              <h2 className="pf-clean-table-title">Points History</h2>
              <div className="pf-table-wrap">
                <table className="pf-clean-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Role</th>
                      <th>Recipient</th>
                      <th>Points</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointsLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#7a6148" }}>
                          No point transactions yet.
                        </td>
                      </tr>
                    ) : (
                      pointsLedger.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.date}</td>
                          <td><strong>{tx.itemTitle}</strong></td>
                          <td>{tx.role}</td>
                          <td>{tx.recipient || "Owner"}</td>
                          <td><span className="pf-pts-tag">+{tx.points} pts</span></td>
                          <td><span className="pf-status-tag">{tx.status}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="pf-clean-table-box">
              <h2 className="pf-clean-table-title">Campus Leaderboard</h2>
              <div className="pf-table-wrap">
                <table className="pf-clean-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Rank</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Items Returned</th>
                      <th>Points</th>
                      <th>Recognition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullLeaderboard.map((entry) => (
                      <tr
                        key={entry.name + entry.rank}
                        className={entry.isCurrentUser ? "is-current-row" : ""}
                      >
                        <td>
                          <span className={`pf-rank-badge ${entry.rank <= 3 ? `top-${entry.rank}` : ""}`}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td>
                          <strong>{entry.name}</strong>
                          {entry.isCurrentUser && <span className="pf-you-pill">You</span>}
                        </td>
                        <td style={{ color: "#7a6148" }}>{entry.department}</td>
                        <td>{entry.itemsReturned}</td>
                        <td><strong>{entry.points} pts</strong></td>
                        <td><span className="pf-badge-tier">{entry.badge}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {reportModalType && (
        <ReportModal
          type={reportModalType}
          onClose={() => setReportModalType(null)}
          onViewItem={(id) => {
            setReportModalType(null);
            setInspectItemId(id);
          }}
          onViewReport={(id) => {
            setReportModalType(null);
            setHighlightedId(id);
            setExpandedId(id);
            setTimeout(() => {
              const el = document.getElementById(`pf-item-${id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
          }}
        />
      )}

      {inspectItemId && (
        <ItemModal
          itemId={inspectItemId}
          onClose={() => setInspectItemId(null)}
          requireLogin={(action) => action?.()}
        />
      )}
    </div>
  );
}
