import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import HytLogo from "./HytLogo";

export default function Navbar() {
  const { user, logout, notifications, dismissNotifications } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  function toggleNotifs() {
    setShowNotifs((s) => !s);
  }

  function handleLogout() {
    logout();
    navigate("/browse");
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" title="HYT — Have Your Thing">
          <HytLogo size={34} showTagline={true} />
        </NavLink>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Story
          </NavLink>
          <NavLink to="/browse" className={({ isActive }) => (isActive ? "active" : "")}>
            Browse Board
          </NavLink>
          <NavLink to="/report-lost" className={({ isActive }) => (isActive ? "active" : "")}>
            Report Lost
          </NavLink>
          <NavLink to="/report-found" className={({ isActive }) => (isActive ? "active" : "")}>
            Report Found
          </NavLink>
        </div>

        <div className="nav-actions" style={{ position: "relative" }}>
          <button className="icon-btn" onClick={toggleNotifs} aria-label="Notifications">
            🔔
            {notifications.length > 0 && <span className="dot">{notifications.length}</span>}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-panel-header">Match notifications</div>
              {notifications.length === 0 ? (
                <div className="notif-empty">No notifications yet.</div>
              ) : (
                notifications.map((n) => (
                  <div className="notif-item" key={n.id}>
                    {n.message}
                    <span className="time">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                ))
              )}
              {notifications.length > 0 && (
                <div style={{ padding: "0.6rem 1rem" }}>
                  <button className="link-btn" onClick={dismissNotifications}>
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {user ? (
            <>
              <span style={{ color: "#cbd4ee", fontSize: "0.85rem" }}>Hi, {user.name}</span>
              <button className="ghost-btn" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <button className="pill-btn" onClick={() => navigate("/login")}>
              Log in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
