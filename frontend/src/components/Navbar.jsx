import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { user, logout, notifications, dismissNotifications } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function toggleNotifs() {
    setShowNotifs((s) => !s);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleScrollTo(id) {
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">FB</span>
          FindBack
        </NavLink>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink to="/browse" className={({ isActive }) => (isActive ? "active" : "")}>
            Browse
          </NavLink>
          <button
            type="button"
            className="nav-text-btn"
            onClick={() => handleScrollTo("how-it-works")}
          >
            How It Works
          </button>
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
