import { useState } from "react";
import { useApp } from "../../context/AppContext";

const SAMPLE_CAMPUS_HISTORY = [
  {
    id: "hist-1",
    title: "Black Leather Bifold Wallet",
    category: "Accessories",
    status: "Returned",
    date: "Today, 2:15 PM",
    location: "Main Library — Desk 14",
    owner: "Aditi S.",
    finder: "Campus Security Team",
    matchScore: "98% Match",
    note: "Matched via description & ID card inside. Handed over at central desk.",
  },
  {
    id: "hist-2",
    title: "Apple AirPods Pro (2nd Gen)",
    category: "Electronics",
    status: "Returned",
    date: "Yesterday, 5:40 PM",
    location: "Central Canteen, Table 6",
    owner: "Rahul M.",
    finder: "Pooja K.",
    matchScore: "95% Match",
    note: "Case engraving matched report details.",
  },
  {
    id: "hist-3",
    title: "Calculus & Linear Algebra 4th Ed.",
    category: "Books",
    status: "Returned",
    date: "Sep 18, 11:30 AM",
    location: "Room 302, Academic Block B",
    owner: "Karan D.",
    finder: "Prof. Verma",
    matchScore: "100% Match",
    note: "Owner name inscribed on first page.",
  },
  {
    id: "hist-4",
    title: "Titan Classic Leather Wristwatch",
    category: "Accessories",
    status: "Returned",
    date: "Sep 17, 4:10 PM",
    location: "Gymnasium Locker 18",
    owner: "Meera P.",
    finder: "Sports Coach",
    matchScore: "92% Match",
    note: "Verified with purchase receipt.",
  },
  {
    id: "hist-5",
    title: "Campus Smart ID Card & Lanyard",
    category: "Documents",
    status: "Returned",
    date: "Sep 16, 1:20 PM",
    location: "Bus Stop 2, Campus Gate",
    owner: "Siddharth N.",
    finder: "Shuttle Driver",
    matchScore: "100% Match",
    note: "Handed over directly to student administration.",
  },
];

export default function HistoryModal({ open, onClose }) {
  const { user, items } = useApp();
  const [tab, setTab] = useState("all"); // 'all' | 'my'

  if (!open) return null;

  const myItems = items.filter(
    (it) => user && (it.reportedBy === user.email || it.reportedBy === user.name)
  );

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="History">
      <div className="modal-sheet history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-tag">Campus Records</span>
            <h2>History &amp; Resolved Items</h2>
            <p>Track recent items successfully reunited with their owners across campus.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="history-tabs">
          <button
            className={`history-tab-btn ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            <span>All Campus Returns</span>
            <span className="count-pill">{SAMPLE_CAMPUS_HISTORY.length}</span>
          </button>
          <button
            className={`history-tab-btn ${tab === "my" ? "active" : ""}`}
            onClick={() => setTab("my")}
          >
            <span>My Activity</span>
            <span className="count-pill">{myItems.length}</span>
          </button>
        </div>

        <div className="history-content-scroll">
          {tab === "all" ? (
            <div className="history-list">
              {SAMPLE_CAMPUS_HISTORY.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-card-header">
                    <div className="history-item-badge">
                      <span className="history-dot" />
                      <span className="history-badge-text">{item.status}</span>
                    </div>
                    <span className="history-date">{item.date}</span>
                  </div>

                  <div className="history-main-row">
                    <div>
                      <h4 className="history-item-title">{item.title}</h4>
                      <div className="history-meta-tags">
                        <span className="history-chip">📍 {item.location}</span>
                        <span className="history-chip">🏷️ {item.category}</span>
                        <span className="history-chip score">⚡ {item.matchScore}</span>
                      </div>
                    </div>
                  </div>

                  <p className="history-note">{item.note}</p>

                  <div className="history-footer-row">
                    <span>Reunited with <strong>{item.owner}</strong></span>
                    <span>Received via <strong>{item.finder}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-my-items">
              {!user ? (
                <div className="history-empty">
                  <p>Please log in to view your personal reported items and claims history.</p>
                </div>
              ) : myItems.length === 0 ? (
                <div className="history-empty">
                  <p>You haven't reported any lost or found items yet.</p>
                </div>
              ) : (
                <div className="history-list">
                  {myItems.map((item) => (
                    <div key={item.id} className="history-card">
                      <div className="history-card-header">
                        <span className={`type-tag ${item.type}`}>
                          {item.type === "lost" ? "Reported Lost" : "Reported Found"}
                        </span>
                        <span className="history-date">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="history-item-title">{item.description}</h4>
                      <p className="history-note">Location: {item.location}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="primary-gold-btn" onClick={onClose}>
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
