import { useCallback, useEffect, useRef, useState } from "react";
import Scene from "./Scene";
import Steps from "./Steps";
import { TRACK_VH } from "./timeline";
import "../../styles/landing.css";

const STEP_PROGRESS_TARGETS = [
  { step: 1, label: "Report Lost", p: 0.19 },
  { step: 2, label: "Report Found", p: 0.35 },
  { step: 3, label: "Smart Match", p: 0.50 },
  { step: 4, label: "Reunited!", p: 0.78 },
];

export default function HowItWorksModal({ open, onClose }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const subs = useRef(new Set());
  const st = useRef({ target: 0, current: 0, raf: 0 });

  // Custom subscriber for internal modal scrolling
  const subscribe = useCallback((fn) => {
    subs.current.add(fn);
    fn(st.current.current);
    return () => subs.current.delete(fn);
  }, []);

  const emit = useCallback(() => {
    subs.current.forEach((fn) => fn(st.current.current));
  }, []);

  // Sync scroll position inside the modal
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const s = st.current;

    const tick = () => {
      s.raf = 0;
      s.current = s.current + (s.target - s.current) * 0.22;
      if (Math.abs(s.target - s.current) < 0.0001) s.current = s.target;
      emit();

      // Update current active step pill
      const p = s.current;
      if (p < 0.26) setCurrentStep(1);
      else if (p < 0.42) setCurrentStep(2);
      else if (p < 0.58) setCurrentStep(3);
      else setCurrentStep(4);

      if (s.current !== s.target) s.raf = requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      const top = container.scrollTop;
      const maxScroll = Math.max(1, track.offsetHeight - container.clientHeight);
      s.target = Math.min(1, Math.max(0, top / maxScroll));
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Reset to start on open
    container.scrollTop = 0;
    s.target = 0;
    s.current = 0;
    emit();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [open, emit, onClose]);

  // Jump to specific step
  function jumpToStep(targetP) {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;
    const maxScroll = Math.max(1, track.offsetHeight - container.clientHeight);
    container.scrollTo({ top: targetP * maxScroll, behavior: "smooth" });
  }

  function handleNext() {
    if (currentStep < 4) {
      jumpToStep(STEP_PROGRESS_TARGETS[currentStep].p);
    } else {
      onClose();
    }
  }

  function handlePrev() {
    if (currentStep > 1) {
      jumpToStep(STEP_PROGRESS_TARGETS[currentStep - 2].p);
    }
  }

  if (!open) return null;

  return (
    <div className="how-modal-overlay" role="dialog" aria-modal="true" aria-label="How it works">
      {/* Top Floating Control Bar */}
      <header className="how-modal-topbar">
        <div className="how-modal-title">
          <span className="how-live-badge">Live Demonstration</span>
          <h3>How FindBack Works</h3>
        </div>

        {/* Step jump pills */}
        <nav className="how-step-nav" aria-label="Step navigation">
          {STEP_PROGRESS_TARGETS.map((item) => (
            <button
              key={item.step}
              type="button"
              className={`how-nav-pill ${currentStep === item.step ? "active" : ""}`}
              onClick={() => jumpToStep(item.p)}
            >
              <span className="pill-num">{item.step}</span>
              <span className="pill-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="how-close-btn" onClick={onClose} aria-label="Close how it works">
          <span>✕ Close</span>
        </button>
      </header>

      {/* Scrollable Track inside the Modal */}
      <div className="how-modal-scroll" ref={containerRef}>
        <div className="lp-track" ref={trackRef} style={{ height: `${TRACK_VH}vh` }}>
          <div className="lp-stage">
            <Scene subscribe={subscribe} />
            <Steps subscribe={subscribe} />

            <div className="lp-hint" aria-hidden="true">
              <span>Scroll to explore</span>
              <i />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Navigation Bar */}
      <footer className="how-modal-bottombar">
        <div className="how-bottom-inner">
          <button
            type="button"
            className="how-ctrl-btn secondary"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            &larr; Previous Step
          </button>

          <div className="how-step-indicator">
            Step <strong>{currentStep}</strong> of <strong>4</strong>
          </div>

          {currentStep === 4 ? (
            <button type="button" className="how-ctrl-btn primary-finish" onClick={onClose}>
              Back to Main Website &rarr;
            </button>
          ) : (
            <button type="button" className="how-ctrl-btn primary" onClick={handleNext}>
              Next Step &rarr;
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
