import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ItemCard from "../components/ItemCard";

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: "✨" },
  { id: "Accessories", label: "Accessories & Wallets", icon: "👛" },
  { id: "Electronics", label: "Electronics & Tech", icon: "🎧" },
  { id: "Books", label: "Books & Stationeries", icon: "📚" },
  { id: "Clothing", label: "Clothing & Wearables", icon: "🧣" },
  { id: "Documents", label: "IDs, Cards & Keys", icon: "🪪" },
];

export default function Home() {
  const { items, openModal } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'lost' | 'found'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredItems = useMemo(() => {
    return items
      .filter((it) => (activeTab === "all" ? true : it.type === activeTab))
      .filter((it) => (selectedCategory === "all" ? true : it.category === selectedCategory))
      .filter((it) => (statusFilter === "all" ? true : it.status === statusFilter))
      .filter((it) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
          it.description?.toLowerCase().includes(q) ||
          it.category?.toLowerCase().includes(q) ||
          it.location?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, activeTab, selectedCategory, statusFilter, searchQuery]);

  const lostCount = useMemo(() => items.filter((i) => i.type === "lost").length, [items]);
  const foundCount = useMemo(() => items.filter((i) => i.type === "found").length, [items]);

  return (
    <div className="home-page-root">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-glow" aria-hidden="true" />
        <div className="home-hero-content">
          <div className="hero-top-pill">
            <span className="pill-dot" />
            <span>Campus Lost &amp; Found Portal</span>
          </div>

          <h1 className="hero-headline">
            Find what you’ve <span className="highlight-text">lost</span>.<br />
            Return what you’ve <span className="highlight-text-amber">found</span>.
          </h1>

          <p className="hero-subtext">
            Everything misplaced on campus gathered in one unified digital board.
            Smart matching, instant photo alerts, and secure handovers at the central desk.
          </p>

          {/* Quick Search Bar */}
          <div className="hero-search-wrap">
            <div className="hero-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword, item name, brand, or campus location…"
                aria-label="Search items"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Primary Action Cards */}
          <div className="hero-action-cards">
            {/* Report Lost Card */}
            <div
              className="action-card lost-card"
              onClick={() => navigate("/report-lost")}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <span className="action-badge lost">I Lost Something</span>
                <span className="action-arrow">&rarr;</span>
              </div>
              <h3>Report Lost Item</h3>
              <p>Post a quick description, category, and last-seen spot to alert finders instantly.</p>
              <span className="action-link-label">Post a lost report &rarr;</span>
            </div>

            {/* Report Found Card */}
            <div
              className="action-card found-card"
              onClick={() => navigate("/report-found")}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <span className="action-badge found">I Found Something</span>
                <span className="action-arrow">&rarr;</span>
              </div>
              <h3>Report Found Item</h3>
              <p>Picked something up? Snap a photo and drop it at the desk so the owner can claim it.</p>
              <span className="action-link-label">Post a found report &rarr;</span>
            </div>

            {/* How It Works Card (triggers the animation!) */}
            <div
              className="action-card how-card"
              onClick={() => openModal("howItWorks")}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <span className="action-badge interactive">Interactive 3D Demo</span>
                <span className="action-arrow">▶</span>
              </div>
              <h3>How It Works</h3>
              <p>Experience the 4-step smart matching animation from report to verified return.</p>
              <span className="action-link-label highlight">Watch the live demo &rarr;</span>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Trust & Recovery Metrics */}
      <section className="metrics-strip">
        <div className="metrics-container">
          <div className="metric-item">
            <span className="metric-number">480+</span>
            <span className="metric-label">Items Reunited on Campus</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <span className="metric-number">98.6%</span>
            <span className="metric-label">Smart Match Accuracy</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <span className="metric-number">&lt; 15m</span>
            <span className="metric-label">Average Notification Time</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <span className="metric-number">100%</span>
            <span className="metric-label">Verified Desk Handovers</span>
          </div>
        </div>
      </section>

      {/* Main Live Board Section */}
      <section className="board-section" id="campus-board">
        <div className="board-header">
          <div className="board-title-group">
            <h2>Live Campus Board</h2>
            <p>Real-time lost and found listings across all campus buildings.</p>
          </div>

          {/* Type Filter Tabs */}
          <div className="board-tabs" role="tablist">
            <button
              className={`board-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
              role="tab"
              aria-selected={activeTab === "all"}
            >
              <span>All Listings</span>
              <span className="tab-count">{items.length}</span>
            </button>

            <button
              className={`board-tab ${activeTab === "lost" ? "active" : ""}`}
              onClick={() => setActiveTab("lost")}
              role="tab"
              aria-selected={activeTab === "lost"}
            >
              <span>Lost Items</span>
              <span className="tab-count">{lostCount}</span>
            </button>

            <button
              className={`board-tab ${activeTab === "found" ? "active" : ""}`}
              onClick={() => setActiveTab("found")}
              role="tab"
              aria-selected={activeTab === "found"}
            >
              <span>Found Items</span>
              <span className="tab-count">{foundCount}</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="category-pills-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-pill ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Status & Secondary Filters */}
        <div className="board-filter-controls">
          <span className="results-count">
            Showing <strong>{filteredItems.length}</strong> items
          </span>

          <div className="filter-select-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported (Open)</option>
              <option value="Matched">Matched</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="board-empty-state">
            <div className="empty-icon">📦</div>
            <h3>No items found</h3>
            <p>No listings match your selected search or category filters.</p>
            <button
              type="button"
              className="primary-gold-btn"
              onClick={() => {
                setActiveTab("all");
                setSelectedCategory("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="board-grid">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Reunions & Help Section */}
      <section className="reunions-banner-section">
        <div className="reunions-card">
          <div className="reunions-text">
            <span className="reunions-badge">📜 Verified Handover Logs</span>
            <h3>Want to see what has been returned recently?</h3>
            <p>
              Check the campus recovery history to see items recently claimed and safely handed over to their owners.
            </p>
          </div>
          <div className="reunions-actions">
            <button
              type="button"
              className="reunions-btn primary"
              onClick={() => openModal("history")}
            >
              View Return History &rarr;
            </button>
            <button
              type="button"
              className="reunions-btn secondary"
              onClick={() => openModal("contact")}
            >
              Contact Campus Desk
            </button>
          </div>
        </div>
      </section>

      {/* Website Footer */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-mark-gold sm">
              <span>📦</span>
            </div>
            <strong>FindBack</strong>
            <span>&bull; Official Campus Lost &amp; Found Portal</span>
          </div>

          <div className="footer-links">
            <button type="button" className="footer-link" onClick={() => openModal("howItWorks")}>
              How it works
            </button>
            <button type="button" className="footer-link" onClick={() => openModal("history")}>
              History
            </button>
            <button type="button" className="footer-link" onClick={() => openModal("contact")}>
              Contact us
            </button>
          </div>

          <div className="footer-copy">
            &copy; {new Date().getFullYear()} FindBack. Reconnecting campus communities.
          </div>
        </div>
      </footer>
    </div>
  );
}
