import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";

export const NAV_LINKS = [
  { id: "search", label: "Search a Lost Item" },
  { id: "how-it-works", label: "How it Works" },
  { id: "history", label: "History" },
  { id: "contact", label: "Contact Us" },
];
const SECTION_IDS = ["top", ...NAV_LINKS.map((l) => l.id)];
const SHRINK_DISTANCE = 120; // px of scroll over which the bar shrinks into a pill

const clamp = (v) => Math.min(1, Math.max(0, v));

// A short, bright bell "ding" — synthesised with the Web Audio API (a few
// detuned sine partials with a quick attack and decay) so hovering the bell
// doesn't depend on shipping/loading an audio file.
let bellCtx;
function playBellChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    bellCtx = bellCtx || new Ctx();
    if (bellCtx.state === "suspended") bellCtx.resume();

    const now = bellCtx.currentTime;
    const master = bellCtx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.22, now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    master.connect(bellCtx.destination);

    // A fundamental plus a couple of quieter overtones gives it a small,
    // bright "bell" timbre rather than a flat beep.
    [[1046.5, 1], [1568, 0.32], [2637, 0.14]].forEach(([freq, level]) => {
      const osc = bellCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = bellCtx.createGain();
      g.gain.value = level;
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 0.85);
    });
  } catch {
    // Web Audio unavailable — the ring animation still plays on its own.
  }
}

export default function Nav({ goTo, onLogin }) {
  const { user, logout, notifications, dismissNotifications } = useApp();
  const rootRef = useRef(null);
  const [active, setActive] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Shrink amount --s (0 = full-width bar at the top, 1 = compact floating pill).
  // It follows the scroll position continuously and is eased, so the bar shrinks
  // going down and grows back into place going up.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 0;
    let cur = 0;
    let raf = 0;

    const paint = () => {
      el.style.setProperty("--s", cur.toFixed(4));
      el.classList.toggle("is-compact", cur > 0.5);
    };
    const tick = () => {
      raf = 0;
      cur = reduce ? target : cur + (target - cur) * 0.2;
      if (Math.abs(target - cur) < 0.002) cur = target;
      paint();
      if (cur !== target) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = clamp(window.scrollY / SHRINK_DISTANCE);

      // which section is in view -> highlight its link
      let now = "";
      const line = window.innerHeight * 0.4;
      for (const id of SECTION_IDS) {
        const s = document.getElementById(id);
        if (s && s.getBoundingClientRect().top <= line) now = id === "top" ? "" : id;
      }
      setActive((prev) => (prev === now ? prev : now));

      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    cur = target; // no shrink animation on first paint / refresh mid-page
    paint();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // close popovers on outside click / Esc
  useEffect(() => {
    if (!menuOpen && !notifOpen) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, notifOpen]);

  const go = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);
    goTo(id);
  };

  return (
    <header className="lp-nav" ref={rootRef} style={{ "--s": 0 }}>
      <div className="lp-nav-bar">
        <nav className="lp-nav-links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={active === l.id ? "is-active" : ""}
              aria-current={active === l.id ? "true" : undefined}
              onClick={(e) => go(e, l.id)}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-actions">
          {user && (
            <div className="lp-notif-wrap">
              <button
                type="button"
                className="lp-icon-btn lp-bell-btn"
                aria-label={`Notifications${notifications.length ? ` (${notifications.length})` : ""}`}
                aria-expanded={notifOpen}
                onMouseEnter={playBellChime}
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setMenuOpen(false);
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {notifications.length > 0 && <em>{notifications.length}</em>}
              </button>
              {notifOpen && (
                <div className="lp-notif-panel" role="region" aria-label="Match notifications">
                  <div className="lp-notif-head">Match notifications</div>
                  {notifications.length === 0 ? (
                    <div className="lp-notif-empty">No notifications yet.</div>
                  ) : (
                    <>
                      {notifications.map((n) => (
                        <div className="lp-notif-item" key={n.id}>
                          {n.message}
                          <small>{new Date(n.createdAt).toLocaleString()}</small>
                        </div>
                      ))}
                      <button type="button" className="lp-notif-clear" onClick={dismissNotifications}>
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <>
              <span className="lp-user" title={user.name}>{user.name?.trim()?.[0]?.toUpperCase() || "U"}</span>
              <button type="button" className="lp-nav-cta lp-nav-cta-ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button type="button" className="lp-nav-cta" onClick={onLogin}>
              Log in
            </button>
          )}

          <button
            type="button"
            className="lp-icon-btn lp-menu-btn"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((o) => !o);
              setNotifOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lp-nav-menu">
          {NAV_LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} className={active === l.id ? "is-active" : ""} onClick={(e) => go(e, l.id)}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
