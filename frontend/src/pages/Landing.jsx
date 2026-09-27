import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { useReveal } from "../hooks/useReveal";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import Nav from "../components/landing/Nav";
import CustomCursor from "../components/landing/CustomCursor";
import SearchSection from "../components/landing/SearchSection";
import HistorySection from "../components/landing/HistorySection";
import ContactSection from "../components/landing/ContactSection";
import LoginModal from "../components/landing/LoginModal";
import ReportModal from "../components/landing/ReportModal";
import ItemModal from "../components/landing/ItemModal";
import GateIntro from "../components/landing/GateIntro";
import HeroSection from "../components/landing/HeroSection";
import Lenis from "lenis";
import "../styles/landing.css";
import "../styles/sections.css";
import "../styles/cursor.css";

const VEIL_MS = 380;

export default function Landing() {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const veilRef = useRef(null);
  const jumping = useRef(false);
  const pending = useRef(null);
  const lenisRef = useRef(null);
  const { subscribe, snap } = useScrollProgress(trackRef);
  const { user } = useApp();

  const [introActive, setIntroActive] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reportType, setReportType] = useState(null); // "lost" | "found" | null
  const [itemId, setItemId] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  useReveal(rootRef);

  useEffect(() => {
    document.title = "FindBack — Find what you've lost. Return what you've found.";
  }, []);

  // Initialize Lenis smooth inertia scrolling for the entire page
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      infinite: false,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Pause Lenis and lock document scroll while modals or gate intro are open
  useEffect(() => {
    const isModalOpen = loginOpen || !!reportType || !!itemId || introActive;
    if (isModalOpen) {
      lenisRef.current?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenisRef.current?.start();
      document.documentElement.style.overflow = "";
    }
  }, [loginOpen, reportType, itemId, introActive]);


  /* ---------------------------------------------------------------- *
   *  Section navigation.                                              *
   *  If the trip between where you are and where you're going would   *
   *  scroll THROUGH the pinned "how it works" animation, we don't     *
   *  scroll through it at all: a soft veil fades in, the page jumps,  *
   *  the veil fades out. Otherwise we use ultra-smooth inertia scroll. *
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
        if (lenisRef.current && !reduce) {
          lenisRef.current.scrollTo(to, {
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        } else {
          window.scrollTo({ top: to, behavior: reduce ? "auto" : "smooth" });
        }
        if (id === "search") {
          setTimeout(() => {
            document.getElementById("search-input")?.focus();
          }, 450);
        }
        return;
      }

      const veil = veilRef.current;
      if (reduce || !veil) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(to, { immediate: true });
        } else {
          window.scrollTo({ top: to, behavior: "auto" });
        }
        requestAnimationFrame(snap);
        return;
      }

      jumping.current = true;
      veil.classList.add("on");
      window.setTimeout(() => {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(to, { immediate: true });
        } else {
          window.scrollTo({ top: to, behavior: "auto" });
        }
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
      {introActive && <GateIntro onComplete={() => setIntroActive(false)} />}
      <CustomCursor subscribe={subscribe} />
      <Nav goTo={goTo} onLogin={openLogin} hoveredSection={hoveredSection} />
      <div className="lp-veil" ref={veilRef} aria-hidden="true" />

      {/* ---------- Hero (Editorial Redesign) ---------- */}
      <HeroSection
        goTo={goTo}
        isHovered={hoveredSection === "top"}
        onMouseEnter={() => setHoveredSection("top")}
        onMouseLeave={() => setHoveredSection((prev) => (prev === "top" ? null : prev))}
      />

      {/* ---------- Search ---------- */}
      <SearchSection
        onOpenItem={setItemId}
        onReport={openReport}
        isHovered={hoveredSection === "search"}
        onMouseEnter={() => setHoveredSection("search")}
        onMouseLeave={() => setHoveredSection((prev) => (prev === "search" ? null : prev))}
      />

      {/* ---------- How it works (Pinned Scrollytelling Sequence) ---------- */}
      <HowItWorksSection
        ref={trackRef}
        subscribe={subscribe}
        isHovered={hoveredSection === "how-it-works"}
        onMouseEnter={() => setHoveredSection("how-it-works")}
        onMouseLeave={() => setHoveredSection((prev) => (prev === "how-it-works" ? null : prev))}
      />

      {/* ---------- History + reviews ---------- */}
      <HistorySection
        isHovered={hoveredSection === "history"}
        onMouseEnter={() => setHoveredSection("history")}
        onMouseLeave={() => setHoveredSection((prev) => (prev === "history" ? null : prev))}
      />

      {/* ---------- Contact ---------- */}
      <ContactSection
        isHovered={hoveredSection === "contact"}
        onMouseEnter={() => setHoveredSection("contact")}
        onMouseLeave={() => setHoveredSection((prev) => (prev === "contact" ? null : prev))}
      />

      <LoginModal open={loginOpen} onClose={closeLogin} onSuccess={afterLogin} />
      {reportType && <ReportModal type={reportType} onClose={closeReport} onViewItem={viewItem} />}
      {itemId && <ItemModal itemId={itemId} onClose={closeItem} requireLogin={requireLogin} />}
    </div>
  );
}
