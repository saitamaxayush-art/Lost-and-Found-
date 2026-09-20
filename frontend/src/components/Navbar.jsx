import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { user, logout, notifications, dismissNotifications, openModal } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  function toggleNotifs() {
    setShowNotifs((s) => !s);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="brand" aria-label="FindBack Home">
          <div className="brand-mark-gold">
            <span className="brand-icon">📦</span>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">FindBack</span>
            <span className="brand-badge">Campus Lost &amp; Found</span>
          </div>
        </NavLink>

        {/* Core Nav Links requested: History, Contact us, How it works */}
        <div className="nav-links">
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => openModal("history")}
            id="nav-history-btn"
          >
            <span className="nav-link-icon">📜</span>
            <span>History</span>
          </button>

          <button
            type="button"
            className="nav-link-btn"
            onClick={() => openModal("contact")}
            id="nav-contact-btn"
          >
            <span className="nav-link-icon">💬</span>
            <span>Contact us</span>
          </button>

          <button
            type="button"
            className="nav-link-btn highlight-how"
            onClick={() => openModal("howItWorks")}
            id="nav-how-btn"
          >
            <span className="how-spark-dot" />
            <span>How it works</span>
          </button>
        </div>

        {/* Action Buttons & Profile */}
        <div className="nav-actions">
          <NavLink to="/report-lost" className="nav-pill-action lost" id="nav-report-lost">
            <span className="action-symbol">−</span>
            <span>Report Lost</span>
          </NavLink>

          <NavLink to="/report-found" className="nav-pill-action found" id="nav-report-found">
            <span className="action-symbol">+</span>
            <span>Report Found</span>
          </NavLink>

          {/* Notifications bell */}
          <div className="notif-wrapper">
            <button
              type="button"
              className="icon-bell-btn"
              onClick={toggleNotifs}
              aria-label="Notifications"
            >
              🔔
              {notifications.length > 0 && <span className="dot">{notifications.length}</span>}
            </button>

            {showNotifs && (
              <div className="notif-panel">
                <div className="notif-panel-header">
                  <span>Match Alerts</span>
                  {notifications.length > 0 && (
                    <button className="link-btn-clear" onClick={dismissNotifications}>
                      Clear
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="notif-empty">No new notifications. Everything is quiet.</div>
                ) : (
                  notifications.map((n) => (
                    <div className="notif-item" key={n.id}>
                      <p>{n.message}</p>
                      <span className="time">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Auth / Profile */}
          {user ? (
            <div className="nav-user-pill">
              <span className="user-avatar-tag">👤</span>
              <span className="user-display-name">{user.name?.split(" ")[0]}</span>
              <button
                type="button"
                className="nav-logout-btn"
                onClick={handleLogout}
                title="Log out"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="nav-login-btn"
              onClick={() => openModal("login")}
              id="nav-login-btn"
            >
              Log in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
