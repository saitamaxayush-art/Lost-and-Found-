import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { evaluateTimeline } from "../scene/timeline";
import SceneSvg from "../scene/SceneSvg";
import StorySteps from "../scene/StorySteps";
import LoginModal from "../components/LoginModal";
import { useApp } from "../context/AppContext";

export default function Landing() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const trackRef = useRef(null);
  const sceneRef = useRef(null);
  const stepsRef = useRef(null);
  const heroTextRef = useRef(null);
  const scrimRef = useRef(null);
  const finaleRef = useRef(null);
  const progressBarRef = useRef(null);

  const { subscribe } = useScrollProgress(trackRef);

  // Check viewport orientation
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerWidth < 768 || window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Imperative subscription handler - pure function of p
  const handleScroll = useCallback(
    (p) => {
      const portrait = window.innerWidth < 768 || window.innerHeight > window.innerWidth;
      const data = evaluateTimeline(p, { isPortrait: portrait });

      // 1. Update SVG Scene
      if (sceneRef.current) {
        sceneRef.current.applyTimeline(data);
      }

      // 2. Update Story Steps
      if (stepsRef.current) {
        stepsRef.current.applyTimeline(data);
      }

      // 3. Update Hero Text
      if (heroTextRef.current) {
        heroTextRef.current.style.opacity = data.heroText.opacity.toFixed(3);
        heroTextRef.current.style.transform = `translateY(${data.heroText.translateY.toFixed(1)}px)`;
        heroTextRef.current.style.display = data.heroText.opacity <= 0.01 ? "none" : "flex";
      }

      // 4. Update Left Scrim
      if (scrimRef.current) {
        scrimRef.current.style.opacity = data.scrim.opacity.toFixed(3);
      }

      // 5. Update Finale
      if (finaleRef.current) {
        finaleRef.current.style.opacity = data.finale.opacity.toFixed(3);
        finaleRef.current.style.transform = `translateY(${data.finale.translateY.toFixed(1)}px)`;
        finaleRef.current.style.pointerEvents = data.finale.pointerEvents;
        finaleRef.current.style.display = data.finale.opacity <= 0.01 ? "none" : "flex";
      }

      // 6. Update Scroll Progress Bar
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(p * 100).toFixed(1)}%`;
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = subscribe(handleScroll);
    return unsubscribe;
  }, [subscribe, handleScroll]);

  return (
    <div className="landing-story-page">
      {/* 900vh Scroll Track */}
      <div className="story-track" ref={trackRef}>
        {/* Sticky 100svh Viewport Stage */}
        <div className="story-stage">
          {/* Subtle Top Navigation Utility (Discreet Brand & Direct Skip to Browse) */}
          <header className="story-topbar">
            <div className="story-brand">
              <span className="brand-mark">FB</span>
              <span className="story-brand-name">FindBack</span>
            </div>
            <div className="story-top-actions">
              <Link to="/browse" className="skip-browse-link" aria-label="Skip to Browse Board">
                Browse Board <span>→</span>
              </Link>
            </div>
          </header>

          {/* Minimalist Top Scroll Progress Bar */}
          <div className="story-progress-track">
            <div className="story-progress-bar" ref={progressBarRef}></div>
          </div>

          {/* Full-Viewport SVG Scene */}
          <div className="story-svg-container">
            <SceneSvg ref={sceneRef} isPortrait={isPortrait} />
          </div>

          {/* Dark Scrim Overlay on Left Column to ensure step readability */}
          <div className="story-scrim-left" ref={scrimRef} style={{ opacity: 0 }}></div>

          {/* Hero Headline (p = 0) */}
          <div className="story-hero-overlay" ref={heroTextRef}>
            <div className="hero-box-tag">Campus Lost &amp; Found Portal</div>
            <h1 className="story-hero-heading">
              Everything lost on campus ends up in <em>one box</em>.
            </h1>
            <p className="story-hero-sub">
              From lecture halls to dining booths — scroll to discover how lost belongings get reunited.
            </p>
            <div className="scroll-indicator" aria-hidden="true">
              <span className="mouse-wheel">
                <span className="wheel-dot"></span>
              </span>
              <span className="scroll-hint">Scroll down to unfold the story</span>
            </div>
          </div>

          {/* Left Column Story Steps (Steps 1 to 5) */}
          <div className="story-left-col">
            <StorySteps ref={stepsRef} />
          </div>

          {/* Finale Call to Action (p = 0.90 - 1.0) */}
          <div className="story-finale-overlay" ref={finaleRef} style={{ opacity: 0, display: "none" }}>
            <div className="finale-card">
              <span className="finale-tag">Ready to Find or Return?</span>
              <h2 className="finale-title">
                Find what you’ve <em>lost</em>.<br />
                Return what you’ve <em>found</em>.
              </h2>
              <p className="finale-sub">
                Join students and faculty across campus to report misplaced items or claim what’s rightfully yours.
              </p>

              <div className="finale-actions">
                {user ? (
                  <Link to="/browse" className="btn-amber-finale">
                    Open the lost &amp; found board <span>→</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn-amber-finale"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    Log in to get started <span>→</span>
                  </button>
                )}
                <Link to="/browse" className="btn-ghost-finale">
                  Or browse items directly
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
