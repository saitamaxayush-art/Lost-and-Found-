import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Nav from "../components/landing/Nav";
import ReportModal from "../components/landing/ReportModal";
import ItemModal from "../components/landing/ItemModal";
import LoginModal from "../components/landing/LoginModal";
import { FAKE_LEADERBOARD } from "../data/profileData";
import { useSlidingIndicator } from "../hooks/useSlidingIndicator";

import IdentityHero from "../components/profile/IdentityHero";
import ReportRow from "../components/profile/ReportRow";
import RewardsTab from "../components/profile/RewardsTab";

import "../styles/landing.css";
import "../styles/sections.css";
import "../styles/profile.css";

export default function Profile() {
  const {
    user,
    login,
    items,
    userPoints,
    pointsLedger,
    markItemMatched,
    requestMarkAsMatched,
    markItemReturned,
    notifications,
    dismissNotifications,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "rewards"
  const [filterType, setFilterType] = useState("all"); // "all" | "lost" | "found"
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(() => location.state?.highlightItemId || null);

  const [reportModalType, setReportModalType] = useState(null);
  const [inspectItemId, setInspectItemId] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const searchInputRef = useRef(null);
  const tabsContainerRef = useRef(null);
  const segContainerRef = useRef(null);

  const tabIndicator = useSlidingIndicator(tabsContainerRef, activeTab, "[data-indicator-key]");
  const segIndicator = useSlidingIndicator(segContainerRef, filterType, "[data-indicator-key]");

  useEffect(() => {
    document.title = "My Profile — FindBack";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Keyboard shortcut: '/' focuses search input when reports tab is active
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        activeTab === "reports" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Handle redirect from report flow with highlight
  useEffect(() => {
    const targetId = location.state?.highlightItemId;
    if (targetId) {
      setHighlightedId(targetId);
      setActiveTab("reports");
      setFilterType("all");
      setSearchQuery("");
      setExpandedId(targetId);

      const timer = setTimeout(() => {
        const el = document.getElementById(`pf-item-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 250);

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
        const matchLoc = (item.locationLost || item.locationFound || "").toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchLoc) return false;
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
      department: user?.campus || user?.department || "Main Campus",
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
    return entry ? entry.rank : 1;
  }, [fullLeaderboard]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkMatched = (e, item) => {
    e?.stopPropagation?.();
    const claimant = item.matchedUsers?.[0]?.name || "Verified Student";
    markItemMatched(item.id, claimant);
  };

  const handleRequestMatch = (e, item) => {
    e?.stopPropagation?.();
    requestMarkAsMatched(item.id, item.matchedProduct?.finderName);
  };

  const handleOwnerMarkReturned = (e, item) => {
    e?.stopPropagation?.();
    const finder = item.matchedProduct?.finderName || "Campus Finder";
    markItemReturned(item.id, finder, { silent: true });
  };

  // Not logged in gate state
  if (!user) {
    return (
      <div className="pf-page">
        <Nav goTo={(id) => navigate("/", { state: { scrollTo: id } })} onLogin={() => setLoginModalOpen(true)} />
        <div className="pf-container pf-gate-wrap">
          <div className="pf-gate-card">
            <h1 className="pf-gate-title">Login Required</h1>
            <p className="pf-gate-text">
              Please sign in to view your profile, report history, and karma points.
            </p>
            <button
              type="button"
              className="pf-gate-btn"
              onClick={() => setLoginModalOpen(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className="pf-gate-demo-btn"
              onClick={() =>
                login({
                  name: "Demo Student",
                  email: "demo@student.edu",
                  campus: "North Campus, Engineering Block",
                  department: "Computer Science & Engineering",
                  rollNo: "22BCS10482",
                  year: "3rd Year",
                  semester: "Semester 6",
                  hostel: "Boys Hostel Block B, Room 304",
                  bio: "Campus helper · Lost & Found regular",
                  whatsapp: "+91 98765 43210",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                })
              }
            >
              Instant Demo Sign-In
            </button>
            <button
              type="button"
              className="pf-gate-home-link"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
        <LoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => setLoginModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="pf-page">
      <Nav goTo={(id) => navigate("/", { state: { scrollTo: id } })} onLogin={() => setLoginModalOpen(false)} />

      <main className="pf-container">
        {/* A. Identity Hero Card */}
        <IdentityHero
          user={user}
          userPoints={userPoints}
          userRank={userRank}
          reportsCount={userItems.length}
          pointsLedger={pointsLedger}
          notifications={notifications}
          onDismissNotifications={dismissNotifications}
          onReportLost={() => setReportModalType("lost")}
          onReportFound={() => setReportModalType("found")}
        />

        {/* B. Sticky Tabs with Sliding Indicator */}
        <div className="pf-sticky-nav-bar">
          <div className="pf-tabs-container" ref={tabsContainerRef} role="tablist">
            <div
              className="pf-tabs-sliding-indicator"
              style={tabIndicator}
              aria-hidden="true"
            />
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "reports"}
              data-indicator-key="reports"
              className={`pf-tab-button ${activeTab === "reports" ? "is-active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              <span>Reports</span>
              <span className="pf-tab-count">{userItems.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "rewards"}
              data-indicator-key="rewards"
              className={`pf-tab-button ${activeTab === "rewards" ? "is-active" : ""}`}
              onClick={() => setActiveTab("rewards")}
            >
              <span>Rewards &amp; Karma</span>
            </button>
          </div>
        </div>

        {/* C. Reports Tab */}
        {activeTab === "reports" && (
          <div>
            {/* Toolbar on one line: Segmented Control + Search field with '/' shortcut hint */}
            <div className="pf-reports-toolbar">
              <div className="pf-segmented-control" ref={segContainerRef} role="tablist">
                <div
                  className="pf-seg-thumb"
                  style={segIndicator}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterType === "all"}
                  data-indicator-key="all"
                  className={`pf-seg-btn ${filterType === "all" ? "is-active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  All ({userItems.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterType === "lost"}
                  data-indicator-key="lost"
                  className={`pf-seg-btn ${filterType === "lost" ? "is-active" : ""}`}
                  onClick={() => setFilterType("lost")}
                >
                  Lost ({lostCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterType === "found"}
                  data-indicator-key="found"
                  className={`pf-seg-btn ${filterType === "found" ? "is-active" : ""}`}
                  onClick={() => setFilterType("found")}
                >
                  Found ({foundCount})
                </button>
              </div>

              <div className="pf-search-box">
                <svg
                  className="pf-search-lens"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="pf-search-input"
                  placeholder="Filter reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Filter reports"
                />
                <span className="pf-shortcut-hint" aria-hidden="true">/</span>
              </div>
            </div>

            {/* Reports List */}
            {displayedItems.length === 0 ? (
              <div className="pf-empty-reports-card">
                <svg
                  className="pf-empty-svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <p className="pf-empty-line">No reports matching your current filter.</p>
                <button
                  type="button"
                  className="pf-empty-btn"
                  onClick={() => setReportModalType("lost")}
                >
                  Create report
                </button>
              </div>
            ) : (
              <div className="pf-reports-list">
                {displayedItems.map((item) => (
                  <ReportRow
                    key={item.id}
                    item={item}
                    isExpanded={expandedId === item.id}
                    isHighlighted={highlightedId === item.id}
                    onToggleExpand={toggleExpand}
                    onInspectPhoto={(id) => setInspectItemId(id)}
                    onRequestMatch={handleRequestMatch}
                    onMarkMatched={handleMarkMatched}
                    onOwnerMarkReturned={handleOwnerMarkReturned}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* D. Rewards Tab */}
        {activeTab === "rewards" && (
          <RewardsTab
            userPoints={userPoints}
            pointsLedger={pointsLedger}
            fullLeaderboard={fullLeaderboard}
          />
        )}
      </main>

      {/* Report Modal */}
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

      {/* Item Lightbox Modal */}
      {inspectItemId && (
        <ItemModal
          itemId={inspectItemId}
          onClose={() => setInspectItemId(null)}
          requireLogin={(action) => action?.()}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
