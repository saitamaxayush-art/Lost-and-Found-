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

let bellCtx;

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!bellCtx) {
    bellCtx = new Ctx();
  }
  return bellCtx;
}

// Warm up AudioContext on first user interaction so it's already running
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    } catch {}
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}

let lastChimeTime = 0;
export async function playBellChime() {
  try {
    const nowMs = performance.now();
    if (nowMs - lastChimeTime < 160) return;
    lastChimeTime = nowMs;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (ctx.state !== "running") return;

    // Small lookahead buffer to guarantee envelope begins cleanly
    const startTime = ctx.currentTime + 0.02;
    const duration = 0.85;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, startTime);
    master.gain.linearRampToValueAtTime(0.24, startTime + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    master.connect(ctx.destination);

    // Warm bell overtones: fundamental (C6), fifth (G6), octave (C7), third (E7)
    const partials = [
      [1046.5, 1.0, 1.0],
      [1567.98, 0.35, 0.82],
      [2093.0, 0.18, 0.65],
      [2637.02, 0.11, 0.5]
    ];

    partials.forEach(([freq, level, decayRatio]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      const g = ctx.createGain();
      g.gain.setValueAtTime(level, startTime);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * decayRatio);

      osc.connect(g);
      g.connect(master);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch {
    // Web Audio fallback
  }
}

export default function Nav({ goTo, onLogin, hoveredSection }) {
  const { user, logout, notifications, dismissNotifications } = useApp();
  const rootRef = useRef(null);
  const ringTimerRef = useRef(null);
  const [active, setActive] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

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
      el.classList.toggle("is-scrolled", window.scrollY > 25);
    };
    const onScroll = () => {
      paint();

      // which section is in view -> highlight its link
      let now = "";
      const line = window.innerHeight * 0.38;
      for (const id of SECTION_IDS) {
        const s = document.getElementById(id);
        if (s && s.getBoundingClientRect().top <= line) now = id === "top" ? "" : id;
      }
      setActive((prev) => (prev === now ? prev : now));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
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
    setActive(id);
    goTo(id);
  };

  const triggerBellRing = () => {
    setIsRinging(false);
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    requestAnimationFrame(() => {
      setIsRinging(true);
      ringTimerRef.current = setTimeout(() => {
        setIsRinging(false);
      }, 650);
    });
    playBellChime();
  };

  return (
    <header className={`lp-nav ${hoveredSection ? "has-hovered-section" : ""}`} ref={rootRef}>
      <div className="lp-nav-container">
        <div className="lp-nav-center">
          <nav className="lp-nav-links" aria-label="Sections">
            {NAV_LINKS.map((l) => {
              const isSectionHovered = hoveredSection === l.id;
              const isActive = active === l.id;
              return (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  className={`${isActive ? "is-active" : ""} ${isSectionHovered ? "is-section-hovered" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActive(l.id);
                    goTo(l.id);
                  }}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="lp-nav-actions">
          {user && (
            <div className="lp-notif-wrap">
              <button
                type="button"
                className={`lp-icon-btn lp-bell-btn ${isRinging ? "is-ringing" : ""}`}
                aria-label={`Notifications${notifications.length ? ` (${notifications.length})` : ""}`}
                aria-expanded={notifOpen}
                onMouseEnter={triggerBellRing}
                onClick={() => {
                  triggerBellRing();
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
