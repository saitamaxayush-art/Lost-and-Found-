import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { useReveal } from "../hooks/useReveal";
import Scene from "../components/landing/Scene";
import Steps from "../components/landing/Steps";
import Nav from "../components/landing/Nav";
import CustomCursor from "../components/landing/CustomCursor";
import SearchSection from "../components/landing/SearchSection";
import HistorySection from "../components/landing/HistorySection";
import ContactSection from "../components/landing/ContactSection";
import LoginModal from "../components/landing/LoginModal";
import ReportModal from "../components/landing/ReportModal";
import ItemModal from "../components/landing/ItemModal";
import { TRACK_VH } from "../components/landing/timeline";
import "../styles/landing.css";
import "../styles/sections.css";
import "../styles/cursor.css";

const VEIL_MS = 260;

export default function Landing() {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const veilRef = useRef(null);
  const jumping = useRef(false);
  const pending = useRef(null);
  const hintRef = useRef(null);
  const { subscribe, snap } = useScrollProgress(trackRef);
  const { user } = useApp();

  const [loginOpen, setLoginOpen] = useState(false);
  const [reportType, setReportType] = useState(null); // "lost" | "found" | null
  const [itemId, setItemId] = useState(null);

  useReveal(rootRef);

  useEffect(() => {
    document.title = "FindBack — Find what you've lost. Return what you've found.";
  }, []);

  // Fade the "scroll" hint out once the visitor is a little way into the animation track.
  useEffect(() => {
    return subscribe((p) => {
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - p / 0.05));
    });
  }, [subscribe]);

  /* ---------------------------------------------------------------- *
   *  Section navigation.                                              *
   *  If the trip between where you are and where you're going would   *
   *  scroll THROUGH the pinned "how it works" animation, we don't     *
   *  scroll through it at all: a soft veil fades in, the page jumps,  *
   *  the veil fades out. Otherwise we use a normal smooth scroll.     *
   * ---------------------------------------------------------------- */
  const goTo = useCallback(
    (id) => {
      const el = document.getElementById(id);
      const track = trackRef.current;
      if (!el || jumping.current) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const from = window.scrollY;
      const navOffset = id === "top" ? 0 : 68;
      const to = Math.max(0, Math.round(el.getBoundingClientRect().top + from - navOffset));
      if (Math.abs(to - from) < 4) {
        if (id === "search") {
          document.getElementById("search-input")?.focus();
        }
        return;
      }

      const tTop = track.getBoundingClientRect().top + from;
      const tBottom = tTop + track.offsetHeight;
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      const crossesAnimation = lo < tBottom - 1 && hi > tTop + 1;

      if (!crossesAnimation) {
        window.scrollTo({ top: to, behavior: reduce ? "auto" : "smooth" });
        if (id === "search") {
          setTimeout(() => {
            document.getElementById("search-input")?.focus();
          }, 400);
        }
        return;
      }

      const veil = veilRef.current;
      if (reduce || !veil) {
        window.scrollTo({ top: to, behavior: "auto" });
        requestAnimationFrame(snap);
        return;
      }

      jumping.current = true;
      veil.classList.add("on");
      window.setTimeout(() => {
        window.scrollTo({ top: to, behavior: "auto" });
        snap(); // animation state follows instantly, unseen behind the veil
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            veil.classList.remove("on");
            window.setTimeout(() => (jumping.current = false), VEIL_MS);
          })
        );
      }, VEIL_MS);
    },
    [snap]
  );

  /* ---------------------------- auth gate --------------------------- */
  const requireLogin = useCallback(
    (action) => {
      if (user) {
        action();
      } else {
        pending.current = action;
        setLoginOpen(true);
      }
    },
    [user]
  );

  const closeLogin = useCallback(() => {
    pending.current = null;
    setLoginOpen(false);
  }, []);

  const afterLogin = useCallback(() => {
    setLoginOpen(false);
    const action = pending.current;
    pending.current = null;
    action?.();
  }, []);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const openReport = useCallback((type) => requireLogin(() => setReportType(type)), [requireLogin]);
  const closeReport = useCallback(() => setReportType(null), []);
  const closeItem = useCallback(() => setItemId(null), []);
  const viewItem = useCallback((id) => {
    setReportType(null);
    setItemId(id);
  }, []);

  return (
    <div className="lp-root" ref={rootRef}>
      <CustomCursor subscribe={subscribe} />
      <Nav goTo={goTo} onLogin={openLogin} />
      <div className="lp-veil" ref={veilRef} aria-hidden="true" />

      {/* ---------- Hero ---------- */}
      <section id="top" className="lp-hero-section">
        <div className="lp-hero-content">
          <span className="lp-eyebrow">Campus Lost &amp; Found</span>
          <h1>Everything lost on campus ends up in one box.</h1>
          <p>
            Report what you've lost or found, and let smart matching quietly do the searching — so things make
            their way back to the people they belong to.
          </p>
          <div className="lp-hero-actions">
            <button type="button" className="lp-btn-primary" onClick={() => goTo("search")}>
              Search a lost item
            </button>
            <button type="button" className="lp-btn-secondary" onClick={() => goTo("how-it-works")}>
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Search ---------- */}
      <SearchSection onOpenItem={setItemId} onReport={openReport} />

      {/* ---------- How it works (the scroll-driven animation lives here) ---------- */}
      <section id="how-it-works" className="lp-track-section">
        <div className="lp-track-heading">
          <span className="lp-eyebrow">How it Works</span>
          <h2>Keep scrolling to watch a lost item find its way home.</h2>
        </div>

        <div className="lp-track" ref={trackRef} style={{ height: `${TRACK_VH}vh` }}>
          <div className="lp-stage">
            <Scene subscribe={subscribe} />
            <Steps subscribe={subscribe} />
            <div className="lp-hint" ref={hintRef} aria-hidden="true">
              <span>Scroll</span>
              <div className="lp-vert-wave-indicator" aria-hidden="true">
                <svg width="20" height="38" viewBox="0 0 20 38" fill="none">
                  <path
                    className="lp-vert-wave-line"
                    d="M 10 -24 Q 16 -18 10 -12 T 10 0 T 10 12 T 10 24 T 10 36 T 10 48 T 10 64"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-track-outro" aria-hidden="true" />
      </section>

      {/* ---------- History + reviews ---------- */}
      <HistorySection />

      {/* ---------- Contact ---------- */}
      <ContactSection />

      <LoginModal open={loginOpen} onClose={closeLogin} onSuccess={afterLogin} />
      {reportType && <ReportModal type={reportType} onClose={closeReport} onViewItem={viewItem} />}
      {itemId && <ItemModal itemId={itemId} onClose={closeItem} requireLogin={requireLogin} />}
    </div>
  );
}
